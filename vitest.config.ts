import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs live in tests/e2e and run via `npm run test:e2e`.
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
