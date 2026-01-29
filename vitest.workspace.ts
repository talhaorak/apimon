import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "shared",
      root: "packages/shared",
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    test: {
      name: "cli",
      root: "packages/cli",
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    test: {
      name: "api",
      root: "apps/api",
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    test: {
      name: "worker",
      root: "apps/worker",
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  },
]);
