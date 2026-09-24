import { json, readSetting } from "../lib/security.js";

export async function onRequestGet({ env }) {
  try {
    const [linkedinUrl, cvFrAvailable, cvEnAvailable] = await Promise.all([
      readSetting(env.DB, "linkedin_url"),
      readSetting(env.DB, "cv_available"),
      readSetting(env.DB, "cv_en_available")
    ]);
    const frenchAvailable = cvFrAvailable === "true";
    return json({
      linkedinUrl: linkedinUrl || null,
      cvFrAvailable: frenchAvailable,
      cvEnAvailable: cvEnAvailable === "true",
      cvAvailable: frenchAvailable
    });
  } catch {
    return json({ error: "Configuration unavailable" }, 503);
  }
}
