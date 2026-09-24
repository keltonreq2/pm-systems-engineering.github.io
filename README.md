# Patrice Masson — engineering portfolio

A lightweight, accessible portfolio for an electrotechnical professional studying engineering at ENSEEIHT. It is built with HTML, CSS and a small amount of native JavaScript. There is no application server and no third-party runtime dependency.

The published site is written in English to preserve the language of the existing portfolio. The original text and media inventory is kept in a separate private migration archive; that archive is excluded from the public repository. The CV previews contain contact details, so they are not included in the site or repository.

## Project structure

```text
.
├── index.html                         # All public sections and project summaries
├── css/styles.css                     # Layout, colors, typography and responsive rules
├── js/main.js                         # Mobile navigation only
├── assets/images/                     # Compressed, selected portfolio images
├── assets/favicon.svg                 # Original wave-and-gear mark
├── migration-audit.md                 # Source inventory, gaps and migration decisions
├── robots.txt
└── sitemap.xml
```

## Preview locally

Open `index.html` directly in a browser, or run a small static server from the project folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. The same relative paths work on a GitHub Pages project site.

## Make changes

- **Edit a paragraph or heading:** open `index.html` and find the relevant section ID, such as `#about`, `#education` or `#projects`.
- **Add an image:** copy an optimized image into `assets/images/`, then add an `<img>` with a useful `alt` description. Keep images local; the site does not load images from a third-party host.
- **Add a project:** copy an existing `<article class="project-card">` inside the projects grid. Replace the title, image, source-backed project details and alt text. Keep `[CONTENT TO COMPLETE]` until you can verify a missing fact.
- **Add a section/page:** add a semantic `<section>` with a unique `id` in `index.html`, then add a matching link in the primary navigation. This single-page structure keeps navigation and deployment simple.
- **Change the look:** edit CSS custom properties near the start of `css/styles.css`; responsive breakpoints are grouped near the end.
- **Update the audit:** record newly recovered content or decisions in `migration-audit.md`. Keep the private original-content archive separate from this public repository.

## Publish with GitHub Pages

The repository includes `.github/workflows/pages.yml`. After pushing the project to the `main` branch, open **Settings → Pages**, choose **GitHub Actions** as the build and deployment source if GitHub has not selected it automatically, then check the workflow run. GitHub Pages publishes the static files without an application server. Later changes are published by committing and pushing to `main`.

The workflow is configured for a project site at `https://keltonreq2.github.io/eportfolio/`. If the repository gets another name or owner, update the sitemap and canonical/Open Graph URL in `index.html` and `sitemap.xml`.

## Known content to complete

The public source contains no verified email address or public contact URL, no CV PDF, no named formal qualifications before ENSEEIHT, and no detailed methods, constraints or personal lessons for most projects. These are marked in the site instead of being guessed. Review `migration-audit.md` before publishing and replace placeholders only with details you want made public.
