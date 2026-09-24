import { json, readSetting, requireSameOrigin, writeSetting } from "../../lib/security.js";

const LINKEDIN_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%.-]+\/?(?:\?[A-Za-z0-9_=&%-]*)?$/u;

export async function onRequestGet({ env }) {
  try {
    const [linkedinUrl, sitePublic, cvFrAvailable, cvEnAvailable] = await Promise.all([
      readSetting(env.DB, "linkedin_url"),
      readSetting(env.DB, "site_public"),
      readSetting(env.DB, "cv_available"),
      readSetting(env.DB, "cv_en_available")
    ]);
    const [cvFrObject, cvEnObject] = await Promise.all([
      cvFrAvailable === "true" ? env.CV_BUCKET?.head("cv-pm-systems-engineering.pdf") : null,
      cvEnAvailable === "true" ? env.CV_BUCKET?.head("cv-pm-systems-engineering-en.pdf") : null
    ]);
    return json({
      linkedinUrl: linkedinUrl || "",
      sitePublic: sitePublic === "true",
      cvFrAvailable: Boolean(cvFrObject),
      cvFrSize: cvFrObject?.size || 0,
      cvEnAvailable: Boolean(cvEnObject),
      cvEnSize: cvEnObject?.size || 0,
      cvAvailable: Boolean(cvFrObject),
      cvSize: cvFrObject?.size || 0
    });
  } catch {
    return json({ error: "Réglages indisponibles" }, 503);
  }
}

export async function onRequestPut({ request, env }) {
  if (!requireSameOrigin(request)) return json({ error: "Requête refusée" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const linkedinUrl = typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
  if (linkedinUrl && (!LINKEDIN_PATTERN.test(linkedinUrl) || linkedinUrl.length > 300)) {
    return json({ error: "Saisissez une adresse de profil LinkedIn valide (linkedin.com/in/…)." }, 400);
  }
  if (body.sitePublic !== undefined && typeof body.sitePublic !== "boolean") return json({ error: "État de visibilité invalide" }, 400);
  const updates = [writeSetting(env.DB, "linkedin_url", linkedinUrl)];
  if (typeof body.sitePublic === "boolean") updates.push(writeSetting(env.DB, "site_public", String(body.sitePublic)));
  await Promise.all(updates);
  return json({ ok: true });
}
