import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as middleware } from "../functions/_middleware.js";
import { onRequestPut as updateSettings } from "../functions/api/admin/settings.js";
import { onRequestPut as uploadCv } from "../functions/api/admin/cv.js";
import { onRequestPut as uploadEnglishCv } from "../functions/api/admin/cv/en.js";
import { onRequestGet as getEnglishCv } from "../functions/api/cv/en.js";
import { onRequestGet as getPublicConfig } from "../functions/api/public-config.js";
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

test("English CV upload stores the separate fixed key and setting", async () => {
  let stored = null;
  const writes = [];
  const form = new FormData();
  form.append("cv", new File(["%PDF-1.7\nEnglish test"], "profile-en.pdf", { type: "application/pdf" }));
  const request = new Request("https://portfolio.example/api/admin/cv/en", {
    method: "PUT", headers: { Origin: "https://portfolio.example" }, body: form
  });
  const env = {
    DB: { prepare: (sql) => ({ bind: (...values) => ({ run: async () => writes.push({ sql, values }) }) }) },
    CV_BUCKET: { put: async (...args) => { stored = args; } }
  };
  const response = await uploadEnglishCv({ request, env });
  assert.equal(response.status, 200);
  assert.equal(stored[0], "cv-pm-systems-engineering-en.pdf");
  assert.equal(stored[2].httpMetadata.contentType, "application/pdf");
  assert.ok(writes.some(({ values }) => values[0] === "cv_en_available" && values[1] === "true"));
  assert.equal(writes.some(({ values }) => values[0] === "cv_available"), false);
});

test("English public CV remains unavailable when its D1 setting is missing or false", async () => {
  let bucketRead = false;
  const env = {
    DB: { prepare: () => ({ bind: () => ({ first: async () => null }) }) },
    CV_BUCKET: { get: async () => { bucketRead = true; return { body: "%PDF-" }; } }
  };
  const response = await getEnglishCv({ env });
  assert.equal(response.status, 404);
  assert.equal(bucketRead, false);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});

test("public config exposes separate CV states while retaining the French alias", async () => {
  const settings = new Map([ ["cv_available", "true"] ]);
  const env = { DB: { prepare: () => ({ bind: (key) => ({ first: async () => settings.has(key) ? { value: settings.get(key) } : null }) }) } };
  const response = await getPublicConfig({ env });
  const config = await response.json();
  assert.equal(config.cvFrAvailable, true);
  assert.equal(config.cvEnAvailable, false);
  assert.equal(config.cvAvailable, true);
});

test("public pages use the stable canonical origin without adding noindex", async () => {
  const response = await middleware({
    request: new Request("https://pages.example/en/"),
    env: { DB: { prepare: () => ({ first: async () => ({ value: "true" }) }) } },
    next: async () => new Response('<link rel="canonical" href="__SITE_ORIGIN__/en/"><meta property="og:url" content="__SITE_ORIGIN__/en/">', {
      headers: { "Content-Type": "text/html; charset=utf-8", "Content-Length": "91", ETag: '"build-tag"' }
    })
  });
  const html = await response.text();
  assert.match(html, /https:\/\/pm-systems-engineering-github-io\.pages\.dev\/en\//u);
  assert.doesNotMatch(html, /pages\.example/u);
  assert.doesNotMatch(html, /__SITE_ORIGIN__|__LINKEDIN_ARRAY__/u);
  assert.equal(response.headers.get("X-Robots-Tag"), null);
  assert.equal(response.headers.get("ETag"), null);
});

test("SITE_ORIGIN can pin the canonical hostname", async () => {
  const response = await middleware({
    request: new Request("https://preview.example/"),
    env: {
      SITE_ORIGIN: "https://portfolio.example/some/path",
      DB: { prepare: () => ({ first: async () => ({ value: "true" }) }) }
    },
    next: async () => new Response('<link rel="canonical" href="__SITE_ORIGIN__/">', { headers: { "Content-Type": "text/html" } })
  });
  assert.match(await response.text(), /https:\/\/portfolio\.example\//u);
});

test("configured public LinkedIn is included safely in JSON-LD", async () => {
  const DB = { prepare: (sql) => ({ first: async () => sql.includes("linkedin_url")
    ? { value: "https://www.linkedin.com/in/patrice-masson" }
    : { value: "true" } }) };
  const response = await middleware({
    request: new Request("https://temporary-hash.pages.dev/"),
    env: { DB },
    next: async () => new Response('<script type="application/ld+json">{"sameAs":__LINKEDIN_ARRAY__}</script>', {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    })
  });
  const html = await response.text();
  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/u)[1]);
  assert.deepEqual(jsonLd.sameAs, ["https://www.linkedin.com/in/patrice-masson"]);
  assert.doesNotMatch(html, /temporary-hash\.pages\.dev/u);
});

test("invalid SITE_ORIGIN never falls back to a temporary deployment hostname", async () => {
  const response = await middleware({
    request: new Request("https://preview-hash.pages.dev/"),
    env: {
      SITE_ORIGIN: "http://preview-hash.pages.dev",
      DB: { prepare: () => ({ first: async () => ({ value: "true" }) }) }
    },
    next: async () => new Response('<link rel="canonical" href="__SITE_ORIGIN__/">', { headers: { "Content-Type": "text/html" } })
  });
  assert.match(await response.text(), /https:\/\/pm-systems-engineering-github-io\.pages\.dev\//u);
});

test("robots.txt and sitemap use the configured stable production origin", async () => {
  const env = { SITE_ORIGIN: "https://pm-systems-engineering-github-io.pages.dev", DB: { prepare: () => ({ first: async () => ({ value: "true" }) }) } };
  const sitemap = await middleware({
    request: new Request("https://preview-hash.pages.dev/sitemap.xml"),
    env,
    next: async () => new Response('<loc>__SITE_ORIGIN__/</loc><loc>__SITE_ORIGIN__/en/</loc>', { headers: { "Content-Type": "application/xml" } })
  });
  assert.equal(await sitemap.text(), '<loc>https://pm-systems-engineering-github-io.pages.dev/</loc><loc>https://pm-systems-engineering-github-io.pages.dev/en/</loc>');
  const robots = await middleware({
    request: new Request("https://preview-hash.pages.dev/robots.txt"),
    env,
    next: async () => new Response('Sitemap: __SITE_ORIGIN__/sitemap.xml', { headers: { "Content-Type": "text/plain" } })
  });
  assert.equal(await robots.text(), "Sitemap: https://pm-systems-engineering-github-io.pages.dev/sitemap.xml");
});
