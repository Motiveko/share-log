import path from "path";
import fs from "fs";
import { pathsToModuleNameMapper } from "ts-jest";

// 현재 작업 디렉토리(cwd) 기준으로 tsconfig.json 불러오기
const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

// paths가 정의되어 있는 경우에만 moduleNameMapper 생성
const paths = tsconfig.compilerOptions?.paths;
const moduleNameMapper = paths
  ? pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" })
  : undefined;

/** @type {import('jest').Config} */
const config = {
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist",
  ],
  preset: "ts-jest",
  ...(moduleNameMapper && { moduleNameMapper }),
};

export default config;
