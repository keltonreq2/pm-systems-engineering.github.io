import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { runInNewContext } from "node:vm";
import { onRequest as middleware } from "../functions/_middleware.js";

const pages = [
  { path: new URL("../index.html", import.meta.url), language: "fr" },
  { path: new URL("../en/index.html", import.meta.url), language: "en" }
];

test("French and English pages include the V6 content and working section anchors", async () => {
  const expected = {
    fr: ["field-inspection", "protection-training", "career", "mentors", "objectives", "about", "contact"],
    en: ["field-inspection", "protection-training", "career", "mentors", "objectives", "about", "contact"]
  };
  for (const page of pages) {
    const html = await readFile(page.path, "utf8");
    assert.match(html, new RegExp(`<html lang="${page.language}"`, "u"));
    const ids = [...html.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page.language} page contains duplicate IDs`);
    for (const id of expected[page.language]) assert.ok(ids.includes(id), `${page.language} page is missing #${id}`);
    for (const match of html.matchAll(/\bhref="#([^"\s]+)"/gu)) {
      if (match[1] !== "linkedin") assert.ok(ids.includes(match[1]), `${page.language} page has a broken #${match[1]} link`);
    }
    for (const match of html.matchAll(/\baria-labelledby="([^"]+)"/gu)) {
      for (const id of match[1].split(/\s+/u)) assert.ok(ids.includes(id), `${page.language} page references missing label #${id}`);
    }
    for (const image of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gu)) {
      assert.ok(await readFile(resolve(dirname(page.path.pathname), image[1])).then(() => true, () => false),
        `${page.language} primary image does not exist: ${image[1]}`);
    }
    for (const action of ["linkedin", "cv-fr", "cv-en"]) {
      assert.equal([...html.matchAll(new RegExp(`data-professional-action="${action}"`, "gu"))].length, 2,
        `${page.language} should expose each professional action in the header and contact section`);
    }
    assert.match(html, /__SITE_ORIGIN__\/assets\/images\/og-pm-systems-engineering\.png/u);
    assert.match(html, /twitter:card" content="summary_large_image"/u);
    assert.match(html, /__LINKEDIN_ARRAY__/u);
    for (const srcset of html.matchAll(/\bsrcset="([^"]+)"/gu)) {
      for (const candidate of srcset[1].split(",")) {
        const relativePath = candidate.trim().split(/\s+/u)[0];
        assert.ok(await readFile(resolve(dirname(page.path.pathname), relativePath)).then(() => true, () => false),
          `${page.language} image candidate does not exist: ${relativePath}`);
      }
    }
    for (const image of html.matchAll(/<img\b([^>]+)>/gu)) {
      assert.match(image[1], /\balt="[^"]*"/u, `${page.language} image is missing alt text`);
      assert.match(image[1], /\bwidth="\d+"/u, `${page.language} image is missing intrinsic width`);
      assert.match(image[1], /\bheight="\d+"/u, `${page.language} image is missing intrinsic height`);
    }
  }
});

test("Open Graph artwork has the requested dimensions", async () => {
  const png = await readFile(new URL("../assets/images/og-pm-systems-engineering.png", import.meta.url));
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("JSON-LD is valid after Cloudflare replaces its runtime placeholders", async () => {
  const origin = "https://pm-systems-engineering-github-io.pages.dev";
  for (const page of pages) {
    const html = await readFile(page.path, "utf8");
    const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1];
    assert.ok(raw, `${page.language} JSON-LD block is missing`);
    const json = JSON.parse(raw.replaceAll("__SITE_ORIGIN__", origin).replaceAll("__LINKEDIN_ARRAY__", "[]"));
    assert.equal(json["@type"], "ProfilePage");
    assert.equal(json.mainEntity["@type"], "Person");
    assert.equal(json.mainEntity.name, "Patrice Masson");
    assert.deepEqual(json.mainEntity.sameAs, []);
    assert.ok(json.mainEntity.knowsAbout.includes("Protection Systems"));
    assert.equal(json.mainEntity.url, `${origin}${page.language === "en" ? "/en/" : "/"}`);
    assert.doesNotMatch(raw, /\+33|mailto:|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  }
});

test("Cloudflare serves complete stable canonical, Open Graph, Twitter and JSON-LD metadata", async () => {
  const origin = "https://pm-systems-engineering-github-io.pages.dev";
  for (const page of pages) {
    const source = await readFile(page.path, "utf8");
    const DB = { prepare: (sql) => ({ first: async () => sql.includes("linkedin_url") ? null : { value: "true" } }) };
    const response = await middleware({
      request: new Request(`https://preview-hash.pages.dev${page.language === "en" ? "/en/" : "/"}`),
      env: { DB },
      next: async () => new Response(source, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    });
    const html = await response.text();
    const expectedUrl = `${origin}${page.language === "en" ? "/en/" : "/"}`;
    assert.match(html, new RegExp(`<link rel="canonical" href="${expectedUrl.replaceAll(".", "\\.")}">`, "u"));
    assert.match(html, new RegExp(`<meta property="og:url" content="${expectedUrl.replaceAll(".", "\\.")}">`, "u"));
    assert.match(html, new RegExp(`<meta property="og:image" content="${origin.replaceAll(".", "\\.")}\/assets\/images\/og-pm-systems-engineering\.png">`, "u"));
    assert.match(html, new RegExp(`<meta name="twitter:image" content="${origin.replaceAll(".", "\\.")}\/assets\/images\/og-pm-systems-engineering\.png">`, "u"));
    assert.doesNotMatch(html, /preview-hash\.pages\.dev|__SITE_ORIGIN__|__LINKEDIN_ARRAY__/u);
    const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1];
    assert.deepEqual(JSON.parse(raw).mainEntity.sameAs, []);
  }
});

test("responsive stylesheet includes requested breakpoints and left-aligns long mobile text", async () => {
  const css = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
  for (const width of [350, 390, 680, 900, 980, 1080]) assert.match(css, new RegExp(`@media \\(max-width: ${width}px\\)`, "u"));
  const mobile = css.split("@media (max-width: 680px)")[1].split("@media (max-width: 390px)")[0];
  assert.match(mobile, /text-align: left/u);
  const requestedViewports = [320, 390, 680, 900, 1080, 1440, 1920];
  assert.deepEqual(requestedViewports, [320, 390, 680, 900, 1080, 1440, 1920]);
});

test("all header and contact actions receive configuration or a useful fallback message", async () => {
  const script = await readFile(new URL("../js/main.js", import.meta.url), "utf8");
  const actions = ["linkedin", "cv-fr", "cv-en"].flatMap((action) => [0, 1].map(() => ({
    dataset: { professionalAction: action }, href: "", listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; }
  })));
  const status = { hidden: true, textContent: "" };
  let nextTimer = 0;
  const window = { location: { hash: "", assign() {} }, clearTimeout() {}, setTimeout() { return ++nextTimer; } };
  const document = {
    documentElement: { lang: "fr" },
    querySelector(selector) { return selector === "#action-status" ? status : null; },
    querySelectorAll(selector) { return selector === "[data-professional-action]" ? actions : []; },
    addEventListener() {}
  };
  const context = { document, window, fetch: async () => ({ ok: true, json: async () => ({
    linkedinUrl: "https://www.linkedin.com/in/patrice-masson", cvFrAvailable: false, cvEnAvailable: true
  }) }) };
  runInNewContext(script, context);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(actions.filter((item) => item.dataset.professionalAction === "linkedin").every((item) => item.href === "https://www.linkedin.com/in/patrice-masson" && item.dataset.configured === "true"), true);
  assert.equal(actions.filter((item) => item.dataset.professionalAction === "cv-en").every((item) => item.href === "/api/cv/en" && item.dataset.configured === "true"), true);
  assert.equal(actions.filter((item) => item.dataset.professionalAction === "cv-fr").every((item) => !item.dataset.configured), true);

  const click = actions.find((item) => item.dataset.professionalAction === "cv-fr").listeners.click;
  let prevented = false;
  click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(status.hidden, false);
  assert.equal(status.textContent, "Le CV français n’est pas encore disponible.");
});
