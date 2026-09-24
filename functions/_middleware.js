import { getSession } from "./lib/auth.js";
import { adminSessionRedirect, secureHeaders } from "./lib/security.js";

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

const siteOrigin = (request, env) => {
  if (env.SITE_ORIGIN) {
    try {
      const configured = new URL(env.SITE_ORIGIN);
      if (configured.protocol === "https:") return configured.origin;
    } catch { /* Use the serving host when the optional public setting is invalid. */ }
  }
  return new URL(request.url).origin;
};

const canonicalPaths = new Set(["/", "/index.html", "/en", "/en/", "/en/index.html", "/robots.txt", "/sitemap.xml"]);

async function withCanonicalOrigin(response, canonicalOrigin, path) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!response.ok || !canonicalPaths.has(path) || !(contentType.includes("text/html") || contentType.includes("xml") || contentType.includes("text/plain"))) {
    return withSecureHeaders(response);
  }
  const body = await response.text();
  const headers = new Headers(response.headers);
  for (const header of ["Content-Length", "Content-Encoding", "ETag", "Content-MD5"]) headers.delete(header);
  const rewritten = body.replaceAll("__SITE_ORIGIN__", canonicalOrigin);
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
  return withCanonicalOrigin(await next(), siteOrigin(request, env), path);
}
