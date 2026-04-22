# Astro site (migration in progress)

This folder is an Astro-based build of the JPEG XL community site.

## Goals

- Keep the existing site working while we migrate page-by-page.
- Continue serving JPEG XL images via `<picture><source type="image/jxl">` with fallbacks.
- Optionally add a Docusaurus build later under `/docs/` on the same domain.

## How it works (today)

Right now `site/public/` contains a copy of the existing static site assets so Astro can build and preview it immediately.
As pages are migrated, they should move from `site/public/**/*.html` into `site/src/pages/**/*.astro` (or `.md(x)`), extracting shared layout into components.

## Local dev

```bash
cd site
npm install
npm run dev
```

