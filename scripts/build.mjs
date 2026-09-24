import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const path of ["index.html", "robots.txt", "sitemap.xml", "_routes.json", "css", "js", "assets", "en", "admin"]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
console.log("Cloudflare Pages output created in dist/");
