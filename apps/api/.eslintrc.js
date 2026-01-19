/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/server.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["*.config.ts", "*.config.mts", "*.config.js"],
  rules: {
    "import/no-cycle": "off",
    "@typescript-eslint/consistent-type-imports": "off",
  },
};
