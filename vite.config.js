import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/iife.js",
      name: "TNAFrontendCookies",
      fileName: () => "index.js",
      formats: ["iife"],
    },
    sourcemap: true,
    minify: "oxc",
  },
});
