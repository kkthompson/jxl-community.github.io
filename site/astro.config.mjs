import { defineConfig } from 'astro/config';

export default defineConfig({
  // Keep default output (static) for GitHub Pages.
  build: {
    // Emit flat .html files so legacy links continue to resolve on GitHub Pages.
    format: 'file',
  },
});

