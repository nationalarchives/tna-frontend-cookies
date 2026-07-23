import { defineConfig, globalIgnores } from "eslint/config";
import tnaEslintConfig from "@nationalarchives/eslint-config";

export default defineConfig(
  [...tnaEslintConfig],
  globalIgnores(["**/*.config.mjs", "**/*.test.js"]),
);
