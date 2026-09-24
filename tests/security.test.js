import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as middleware } from "../functions/_middleware.js";
import { onRequestPut as updateSettings } from "../functions/api/admin/settings.js";
import { onRequestPut as uploadCv } from "../functions/api/admin/cv.js";
import { verifyPassword } from "../functions/lib/auth.js";
import { bytesToBase64Url, constantTimeEqual } from "../functions/lib/security.js";

test("constant-time comparison rejects unequal credentials", () => {
  assert.equal(constantTimeEqual("req2", "req2"), true);
  assert.equal(constantTimeEqual("req2", "req3"), false);
  assert.equal(constantTimeEqual("req2", "req"), false);
});

test("PBKDF2 password verifier accepts only the matching high-iteration hash", async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("test-only-passphrase"), "PBKDF2", false, ["deriveBits"]);
  const digest = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 }, key, 256);
  const encoded = `pbkdf2_sha256$600000$${bytesToBase64Url(salt)}$${bytesToBase64Url(digest)}`;
  assert.equal(await verifyPassword("test-only-passphrase", encoded), true);
  assert.equal(await verifyPassword("wrong-passphrase", encoded), false);
  assert.equal(await verifyPassword("test-only-passphrase", encoded.replace("600000", "599999")), false);
});

test("private middleware fails closed and never serves static content", async () => {
  let served = false;
  const response = await middleware({
    request: new Request("https://portfolio.example/project.html"),
    env: { DB: { prepare: () => ({ first: async () => { throw new Error("D1 offline"); } }) } },
    next: async () => { served = true; return new Response("private portfolio source"); }
  });
  assert.equal(response.status, 404);
  assert.equal(await response.text().then((text) => text.includes("private portfolio source")), false);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(served, false);
});

test("public middleware adds no-store headers before returning the asset", async () => {
  const response = await middleware({
    request: new Request("https://portfolio.example/assets/project.webp"),
    env: { DB: { prepare: () => ({ first: async () => ({ value: "true" }) }) } },
    next: async () => new Response("public image", { headers: { "Content-Type": "image/webp" } })
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("X-Robots-Tag"), null);
});

test("login page stays reachable while the public portfolio is private", async () => {
  let served = false;
  const response = await middleware({
    request: new Request("https://portfolio.example/admin/login/"),
    env: {},
    next: async () => { served = true; return new Response("login form"); }
  });
  assert.equal(response.status, 200);
  assert.equal(served, true);
});

test("admin dashboard and APIs require a valid session", async () => {
  const env = { DB: { prepare: () => ({ bind: () => ({ first: async () => null }) }) } };
  const dashboard = await middleware({ request: new Request("https://portfolio.example/admin/"), env, next: async () => new Response("admin") });
  assert.equal(dashboard.status, 303);
  assert.equal(dashboard.headers.get("Location"), "https://portfolio.example/admin/login/");
  const api = await middleware({ request: new Request("https://portfolio.example/api/admin/settings"), env, next: async () => new Response("admin data") });
  assert.equal(api.status, 401);
  assert.equal(await api.text(), "Unauthorized");
});

test("LinkedIn settings reject external or script URLs", async () => {
  const request = new Request("https://portfolio.example/api/admin/settings", {
    method: "PUT",
    headers: { Origin: "https://portfolio.example", "Content-Type": "application/json" },
    body: JSON.stringify({ linkedinUrl: "https://evil.example/in/patrice", sitePublic: true })
  });
  const response = await updateSettings({ request, env: { DB: {} } });
  assert.equal(response.status, 400);
});

test("settings endpoint accepts an empty LinkedIn URL and persists visibility", async () => {
  const writes = [];
  const request = new Request("https://portfolio.example/api/admin/settings", {
    method: "PUT",
    headers: { Origin: "https://portfolio.example", "Content-Type": "application/json" },
    body: JSON.stringify({ linkedinUrl: "", sitePublic: false })
  });
  const DB = { prepare: (sql) => ({ bind: (...values) => ({ run: async () => writes.push({ sql, values }) }) }) };
  const response = await updateSettings({ request, env: { DB } });
  assert.equal(response.status, 200);
  assert.equal(writes.length, 2);
  assert.ok(writes.some(({ values }) => values[0] === "site_public" && values[1] === "false"));
});

test("saving a LinkedIn URL alone cannot silently change the public/private mode", async () => {
  const writes = [];
  const request = new Request("https://portfolio.example/api/admin/settings", {
    method: "PUT",
    headers: { Origin: "https://portfolio.example", "Content-Type": "application/json" },
    body: JSON.stringify({ linkedinUrl: "https://www.linkedin.com/in/patrice-masson" })
  });
  const DB = { prepare: (sql) => ({ bind: (...values) => ({ run: async () => writes.push({ sql, values }) }) }) };
  const response = await updateSettings({ request, env: { DB } });
  assert.equal(response.status, 200);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].values[0], "linkedin_url");
});

test("CV upload stores only a verified PDF under the fixed R2 key", async () => {
  let stored = null;
  const writes = [];
  const form = new FormData();
  form.append("cv", new File(["%PDF-1.7\nportfolio test"], "profile.pdf", { type: "application/pdf" }));
  const request = new Request("https://portfolio.example/api/admin/cv", {
    method: "PUT", headers: { Origin: "https://portfolio.example" }, body: form
  });
  const env = {
    DB: { prepare: (sql) => ({ bind: (...values) => ({ run: async () => writes.push({ sql, values }) }) }) },
    CV_BUCKET: { put: async (...args) => { stored = args; } }
  };
  const response = await uploadCv({ request, env });
  assert.equal(response.status, 200);
  assert.equal(stored[0], "cv-pm-systems-engineering.pdf");
  assert.equal(stored[2].httpMetadata.contentType, "application/pdf");
  assert.ok(writes.some(({ values }) => values[0] === "cv_available" && values[1] === "true"));
});
