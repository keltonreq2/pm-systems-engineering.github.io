import { readSetting } from "../../lib/security.js";

const CV_KEY = "cv-pm-systems-engineering-en.pdf";

export async function onRequestGet({ env }) {
  try {
    if (await readSetting(env.DB, "cv_en_available") !== "true") {
      return new Response("English CV unavailable", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    }
    const object = await env.CV_BUCKET?.get(CV_KEY);
    if (!object) return new Response("English CV unavailable", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="CV-PM-Systems-Engineering-EN.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    });
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="CV-PM-Systems-Engineering-EN.pdf"');
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(object.body, { headers });
  } catch {
    return new Response("English CV unavailable", { status: 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
}
