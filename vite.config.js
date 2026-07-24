import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/iife.js",
      name: "TNAFrontendCookies",
      fileName: (format) =>
        format === "iife" ? "index.js" : `index.${format}.js`,
      formats: ["iife", "es", "umd"],
    },
    sourcemap: true,
    minify: "oxc",
  },
});
