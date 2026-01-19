import baseConfig from "@repo/jest-presets/node/jest-preset.mjs";

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testMatch: ["**/__tests__/e2e/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/test\\.ts$"],
};

export default config;
