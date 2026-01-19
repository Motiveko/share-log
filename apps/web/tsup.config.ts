import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: ["server/index.ts"],
  clean: true,
  format: ["cjs"],
  bundle: true, // 번들링 켜기
  noExternal: [/.*/], // 모든 의존성을 번들 내부로 포함
  target: "node18", // 런타임 Node 버전에 맞춰 설정
  platform: "node", // node 환경에서 돌아갈 코드임을 명시
  sourcemap: true,
  outDir: "dist/server",
  ...options,
}));
