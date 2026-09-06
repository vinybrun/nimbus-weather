import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs so GitHub Pages project sites and local previews both work.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
    // Stable root-level names: a previous hashed /assets/*.js URL 404'd on
    // GitHub Pages after a cached miss. Root files are simpler to verify.
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "chunk-[name].js",
        assetFileNames: "app[extname]",
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
