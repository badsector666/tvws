import { defineConfig } from "vite";

export default defineConfig({
  root: "example",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./example/index.html",
      external: [
        "https://unpkg.com/tvws@0.0.10/dist/index.js",
        "../dist/index.js",
        "../src/index.js",
      ],
    },
  },
  server: {
    port: 5173,
    open: true,
    host: true,
  },
});
