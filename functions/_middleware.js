import { applyContent } from "./lib/content.js";
import { applyPresentation } from "./lib/presentation.js";
import { getSession } from "./lib/auth.js";
import { adminSessionRedirect, secureHeaders } from "./lib/security.js";
import {pitchAuthorized,pitchDenied} from './lib/pitch.js';
import {countedPage,recordPageView} from './lib/page-views.js';

const privatePage = (language) => new Response(`<!doctype html><html lang="${language}"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${language === "en" ? "Private site" : "Site privé"}</title><body><main><h1>${language === "en" ? "This site is currently private" : "Ce site est actuellement privé"}</h1><p>${language === "en" ? "Please come back later." : "Merci de revenir plus tard."}</p></main></body></html>`, {
  status: 404,
  headers: { ...secureHeaders, "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" }
});

const withSecureHeaders = (response, noindex = false) => {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(secureHeaders)) headers.set(key, value);
  if (noindex) headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const PRODUCTION_ORIGIN = "https://pm-systems-engineering-github-io.pages.dev";
const LINKEDIN_PROFILE = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%.-]+\/?(?:\?[A-Za-z0-9_=&%-]*)?$/u;

const siteOrigin = (request, env) => {
  if (env.SITE_ORIGIN) {
    try {
      const configured = new URL(env.SITE_ORIGIN);
      if (configured.protocol === "https:" && !configured.username && !configured.password) return configured.origin;
    } catch { /* Fall back to the stable production origin when the setting is invalid. */ }
  }
  return PRODUCTION_ORIGIN;
};

const canonicalPaths = new Set(["/", "/index.html", "/en", "/en/", "/en/index.html", "/robots.txt", "/sitemap.xml"]);
const canonicalHtmlPaths = new Set(["/", "/index.html", "/en", "/en/", "/en/index.html"]);
const pitchHtmlPaths = new Set(['/pitch','/pitch/','/pitch/index.html','/en/pitch','/en/pitch/','/en/pitch/index.html']);
const verificationToken=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{5,128}$/u.test(value)?value:null;

async function withCanonicalOrigin(response, canonicalOrigin, path, linkedinUrl = null, verifications = {}) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!response.ok || !canonicalPaths.has(path) || !(contentType.includes("text/html") || contentType.includes("xml") || contentType.includes("text/plain"))) {
    return withSecureHeaders(response);
  }
  const body = await response.text();
  const headers = new Headers(response.headers);
  for (const header of ["Content-Length", "Content-Encoding", "ETag", "Content-MD5"]) headers.delete(header);
  const linkedInArray = JSON.stringify(linkedinUrl ? [linkedinUrl] : []).replaceAll("<", "\\u003c");
  let rewritten = body.replaceAll("__SITE_ORIGIN__", canonicalOrigin).replaceAll("__LINKEDIN_ARRAY__", linkedInArray);
  if(canonicalHtmlPaths.has(path)){
    const tags=[['google-site-verification',verifications.google],['msvalidate.01',verifications.bing]]
      .filter(([,value])=>verificationToken(value))
      .map(([name,value])=>`<meta name="${name}" content="${value}">`).join('');
    rewritten=rewritten.replace('</head>',`${tags}</head>`);
  }
  return withSecureHeaders(new Response(rewritten, { status: response.status, statusText: response.statusText, headers }));
}

const adminLoginAssets = (path) => path === "/admin/login" || path.startsWith("/admin/login/") || path.startsWith("/admin/assets/");

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/admin") return withSecureHeaders(Response.redirect(new URL("/admin/", request.url), 308), true);
  if (path === "/admin/login") return withSecureHeaders(Response.redirect(new URL("/admin/login/", request.url), 308), true);

  if (path.startsWith("/admin") || path.startsWith("/api/admin/")) {
    if (adminLoginAssets(path) || path === "/api/admin/login") return withSecureHeaders(await next(), true);
    if (!env.DB) return new Response("Admin service is not configured", { status: 503, headers: secureHeaders });
    let session = null;
    try { session = await getSession(request, env.DB); } catch { /* Fail closed. */ }
    if (!session) {
      if (path.startsWith("/api/admin/")) return new Response("Unauthorized", { status: 401, headers: secureHeaders });
      return withSecureHeaders(adminSessionRedirect(request), true);
    }
    return withSecureHeaders(await next(), true);
  }

  let sitePublic = false;
  try {
    if (!env.DB) throw new Error("D1 not configured");
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site_public'").first();
    sitePublic = row?.value === "true";
  } catch { /* Fail closed if the database is unavailable or uninitialized. */ }
  if (!sitePublic) return privatePage(path.startsWith("/en/") ? "en" : "fr");
  if(pitchHtmlPaths.has(path)){
    try{if(!await pitchAuthorized(request,env))return pitchDenied();}catch{return pitchDenied();}
    const response=withSecureHeaders(await next(),true);
    return applyContent(response,env.DB,path.startsWith('/en/')?'en':'fr');
  }
  let linkedinUrl = null;
  let verifications={};
  if (canonicalHtmlPaths.has(path)) {
    try {
      const [profile,google,bing]=await Promise.all([
        env.DB.prepare("SELECT value FROM settings WHERE key = 'linkedin_url'").first(),
        env.DB.prepare("SELECT value FROM settings WHERE key = 'google_site_verification'").first(),
        env.DB.prepare("SELECT value FROM settings WHERE key = 'bing_site_verification'").first()
      ]);
      if (typeof profile?.value === "string" && LINKEDIN_PROFILE.test(profile.value)) linkedinUrl = profile.value;
      verifications={google:google?.value,bing:bing?.value};
    } catch { /* The structured profile omits LinkedIn when the setting cannot be read. */ }
  }
  const response = await withCanonicalOrigin(await next(), siteOrigin(request, env), path, linkedinUrl, verifications);
  if (!canonicalHtmlPaths.has(path)) return response;
  const language=path.startsWith('/en')?'en':'fr';
  const rendered=await applyPresentation(await applyContent(response,env.DB,language),env,language,request);
  const page=countedPage(request,rendered);
  if(page)try{await recordPageView(env.DB,page);}catch{/* A missing stats migration never blocks the portfolio. */}
  return rendered;
}
