import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: [
        "apps/api/src/**/*.ts",
        "apps/worker/src/**/*.ts",
        "packages/shared/src/**/*.ts",
        "packages/cli/src/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/index.ts",
        "**/dist/**",
        "**/node_modules/**",
      ],
    },
  },
});
