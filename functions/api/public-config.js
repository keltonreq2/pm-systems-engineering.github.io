import { json, readSetting } from "../lib/security.js";

export async function onRequestGet({ env }) {
  try {
    const [linkedinUrl, cvFrAvailable, cvEnAvailable, cvProtected, cepAvailable, cepPublic, cepProtected] = await Promise.all([
      readSetting(env.DB, "linkedin_url"),
      readSetting(env.DB, "cv_available"),
      readSetting(env.DB, "cv_en_available"),
      readSetting(env.DB, "cv_access_enabled"),
      readSetting(env.DB, "cep_available"),
      readSetting(env.DB, "cep_public"),
      readSetting(env.DB, "cep_protected")
    ]);
    const frenchAvailable = cvFrAvailable === "true";
    return json({
      linkedinUrl: linkedinUrl || null,
      cvFrAvailable: frenchAvailable,
      cvEnAvailable: cvEnAvailable === "true",
      cvAvailable: frenchAvailable,
      cvProtected: cvProtected === 'true',
      cepAvailable: cepAvailable === 'true',
      cepPublic: cepPublic === 'true',
      cepProtected: cepProtected === 'true'
    });
  } catch {
    return json({ error: "Configuration unavailable" }, 503);
  }
}
