/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/react.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["*.config.ts", "*.config.mts", "*.config.js"],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "import/no-extraneous-dependencies": "off",
        "react/jsx-no-leaked-render": "off",
        "import/no-cycle": "off",
        "no-undef": "off",
      },
    },
  ],
};
