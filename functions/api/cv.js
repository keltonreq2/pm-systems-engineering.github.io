import { readSetting } from "../lib/security.js";

const CV_KEY = "cv-pm-systems-engineering.pdf";

export async function onRequestGet({ env }) {
  try {
    if (await readSetting(env.DB, "cv_available") !== "true") return new Response("CV indisponible", { status: 404 });
    const object = await env.CV_BUCKET?.get(CV_KEY);
    if (!object) return new Response("CV indisponible", { status: 404 });
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="CV-PM-Systems-Engineering.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    });
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", 'inline; filename="CV-PM-Systems-Engineering.pdf"');
    headers.set("Cache-Control", "private, no-store");
    return new Response(object.body, { headers });
  } catch {
    return new Response("CV indisponible", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
