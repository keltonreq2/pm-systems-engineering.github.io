import { json, readSetting } from "../lib/security.js";

export async function onRequestGet({ env }) {
  try {
    const [linkedinUrl, cvAvailable] = await Promise.all([
      readSetting(env.DB, "linkedin_url"),
      readSetting(env.DB, "cv_available")
    ]);
    return json({ linkedinUrl: linkedinUrl || null, cvAvailable: cvAvailable === "true" });
  } catch {
    return json({ error: "Configuration unavailable" }, 503);
  }
}
