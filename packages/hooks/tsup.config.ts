import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: {
    link: "src/index.ts",
  },
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  external: ["react", "react-dom"],
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outDir: "dist",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".js" : ".js",
      dts: format === "cjs" ? ".d.ts" : ".d.ts",
    };
  },
  ...options,
}));
