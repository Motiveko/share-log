import baseConfig from "@repo/jest-presets/node/jest-preset.mjs";

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/e2e/", "/test\\.ts$"],
};

export default config;
