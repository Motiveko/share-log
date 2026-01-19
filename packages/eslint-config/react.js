const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * This is a custom ESLint configuration for React projects
 * with TypeScript support.
 */

// Disable all jsx-a11y rules dynamically
const jsxA11yPlugin = require("eslint-plugin-jsx-a11y");
const jsxA11yRules = Object.keys(jsxA11yPlugin.rules).reduce((acc, rule) => {
  acc[`jsx-a11y/${rule}`] = "off";
  return acc;
}, {});

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project,
  },
  plugins: ["react", "react-hooks", "@typescript-eslint", "only-warn"],
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: ["node_modules/", "dist/", ".eslintrc.js", "**/*.css"],
  rules: {
    // React
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript for prop validation

    // TypeScript
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",

    // React Hooks
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Disable all jsx-a11y rules
    ...jsxA11yRules,
  },
};
