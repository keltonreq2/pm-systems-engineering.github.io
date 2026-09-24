import { json, requireSameOrigin, writeSetting } from "../../lib/security.js";

const CV_KEY = "cv-pm-systems-engineering.pdf";
const MAX_BYTES = 10 * 1024 * 1024;

export async function onRequestGet({ env }) {
  try {
    const object = await env.CV_BUCKET?.get(CV_KEY);
    if (!object) return new Response("CV indisponible", { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(object.body, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="CV-PM-Systems-Engineering.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    } });
  } catch {
    return new Response("CV indisponible", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function onRequestPut({ request, env }) {
  if (!requireSameOrigin(request)) return json({ error: "Requête refusée" }, 403);
  if (!env.CV_BUCKET) return json({ error: "Stockage CV non configuré" }, 503);
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().startsWith("multipart/form-data;")) return json({ error: "Envoyez un fichier PDF" }, 400);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "Formulaire invalide" }, 400); }
  const file = form.get("cv");
  if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return json({ error: "Le PDF doit peser 10 Mo maximum" }, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type !== "application/pdf" || new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    return json({ error: "Le fichier doit être un PDF valide" }, 400);
  }
  await env.CV_BUCKET.put(CV_KEY, bytes, {
    httpMetadata: { contentType: "application/pdf", contentDisposition: 'inline; filename="CV-PM-Systems-Engineering.pdf"', cacheControl: "private, no-store" }
  });
  await writeSetting(env.DB, "cv_available", "true");
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!requireSameOrigin(request)) return json({ error: "Requête refusée" }, 403);
  await env.CV_BUCKET?.delete(CV_KEY);
  await writeSetting(env.DB, "cv_available", "false");
  return json({ ok: true });
}
