import { deleteSession } from "../../lib/auth.js";
import { json, requireSameOrigin, sessionCookie } from "../../lib/security.js";

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) return json({ error: "Requête refusée" }, 403);
  await deleteSession(request, env.DB);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}
