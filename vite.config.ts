import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs so GitHub Pages project sites and local previews both work.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
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
