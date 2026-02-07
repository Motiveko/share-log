#!/usr/bin/env node

/**
 * 프로젝트 보일러플레이트 설정 스크립트
 *
 * 사용법: node scripts/setup-project.js <프로젝트명> [--port <base-port>]
 *
 * 예시:
 *   node scripts/setup-project.js my-awesome-app
 *   node scripts/setup-project.js my-awesome-app --port 4000
 */

const fs = require("fs");
const path = require("path");

// 현재 프로젝트 설정 (변경 전)
const CURRENT_PROJECT_NAME = "share-log";
const CURRENT_PROJECT_NAME_NO_HYPHEN = "sharelog";
const CURRENT_PORTS = {
  web: 5050,
  api: 5051,
  "notification-worker": 5052,
};

// 검색에서 제외할 디렉토리/파일
const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".next",
  "coverage",
  "logs",
  "*.log",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "setup-project.js", // 이 스크립트 자체 제외
];

// 변경 대상 파일 확장자
const TARGET_EXTENSIONS = [
  ".json",
  ".yml",
  ".yaml",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".env",
  ".env.development",
  ".env.production",
  ".env.local",
  ".env.test",
  "Dockerfile",
];

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
프로젝트 보일러플레이트 설정 스크립트

사용법:
  pnpm setup-project <프로젝트명> [--port <base-port>]

옵션:
  --port <number>  base 포트 번호 (기본값: 랜덤 3000-8000)
  --dry-run        실제 변경 없이 변경될 내용만 출력
  --help, -h       도움말 출력

예시:
  pnpm setup-project my-app
  pnpm setup-project my-app --port 4000
  pnpm setup-project my-app --dry-run
`);
    process.exit(0);
  }

  let projectName = null;
  let basePort = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port" && args[i + 1]) {
      basePort = parseInt(args[i + 1], 10);
      if (isNaN(basePort) || basePort < 1024 || basePort > 65530) {
        console.error("Error: 포트 번호는 1024-65530 사이여야 합니다.");
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (!args[i].startsWith("--") && !projectName) {
      projectName = args[i];
    }
  }

  if (!projectName) {
    console.error("Error: 프로젝트명을 입력해주세요.");
    process.exit(1);
  }

  // 프로젝트명 유효성 검사
  if (!/^[a-z][a-z0-9-]*$/.test(projectName)) {
    console.error(
      "Error: 프로젝트명은 소문자로 시작하고, 소문자/숫자/하이픈만 사용 가능합니다.",
    );
    process.exit(1);
  }

  // 랜덤 포트 생성 (3000-8000 사이, 10의 배수)
  if (!basePort) {
    basePort = Math.floor(Math.random() * 500) * 10 + 3000;
  }

  return { projectName, basePort, dryRun };
}

function shouldIgnore(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return IGNORE_PATTERNS.some((pattern) => {
    if (pattern.startsWith("*")) {
      return relativePath.endsWith(pattern.slice(1));
    }
    return relativePath.split(path.sep).includes(pattern);
  });
}

function isTargetFile(filePath) {
  const basename = path.basename(filePath);

  // .env 파일들 (확장자가 없거나 .env로 시작)
  if (basename.startsWith(".env")) {
    return true;
  }

  // Dockerfile
  if (basename === "Dockerfile") {
    return true;
  }

  // 확장자 체크
  const ext = path.extname(filePath);
  return TARGET_EXTENSIONS.includes(ext);
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.isFile() && isTargetFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function replaceInContent(content, replacements) {
  let result = content;
  for (const [from, to] of replacements) {
    // 대소문자 구분 없이 치환하되, 원본 케이스 유지를 위해 여러 패턴 시도
    const patterns = [
      [from, to],
      [from.toLowerCase(), to.toLowerCase()],
      [from.toUpperCase(), to.toUpperCase()],
      // PascalCase
      [
        from
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(""),
        to
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(""),
      ],
      // camelCase
      [
        from
          .split("-")
          .map((s, i) =>
            i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1),
          )
          .join(""),
        to
          .split("-")
          .map((s, i) =>
            i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1),
          )
          .join(""),
      ],
    ];

    for (const [fromPattern, toPattern] of patterns) {
      result = result.split(fromPattern).join(toPattern);
    }
  }
  return result;
}

function replacePort(content, oldPort, newPort) {
  // 포트 번호 치환 (숫자만 단독으로 있는 경우)
  const portPatterns = [
    // PORT=5050
    new RegExp(`(PORT[=:])\\s*${oldPort}\\b`, "g"),
    // EXPOSE 5050
    new RegExp(`(EXPOSE\\s+)${oldPort}\\b`, "g"),
    // -p 5050:5050
    new RegExp(`${oldPort}:${oldPort}`, "g"),
    // port: 5050 (YAML)
    new RegExp(`(port:\\s*)${oldPort}\\b`, "g"),
    // PORT: 5050 (YAML env)
    new RegExp(`(PORT:\\s*)${oldPort}\\b`, "g"),
  ];

  let result = content;
  for (const pattern of portPatterns) {
    result = result.replace(pattern, (_, prefix) => {
      if (prefix) {
        return `${prefix}${newPort}`;
      }
      return `${newPort}:${newPort}`;
    });
  }
  return result;
}

function main() {
  const { projectName, basePort, dryRun } = parseArgs();

  const projectNameNoHyphen = projectName.replace(/-/g, "");

  const newPorts = {
    web: basePort,
    api: basePort + 1,
    "notification-worker": basePort + 2,
  };

  console.log("\n=== 프로젝트 설정 스크립트 ===\n");
  console.log(`프로젝트명: ${CURRENT_PROJECT_NAME} → ${projectName}`);
  console.log(
    `프로젝트명(no-hyphen): ${CURRENT_PROJECT_NAME_NO_HYPHEN} → ${projectNameNoHyphen}`,
  );
  console.log(`\n포트 설정:`);
  console.log(`  web: ${CURRENT_PORTS.web} → ${newPorts.web}`);
  console.log(`  api: ${CURRENT_PORTS.api} → ${newPorts.api}`);
  console.log(
    `  notification-worker: ${CURRENT_PORTS["notification-worker"]} → ${newPorts["notification-worker"]}`,
  );

  if (dryRun) {
    console.log("\n[DRY RUN 모드] 실제 변경은 수행되지 않습니다.\n");
  }

  // 이름 치환 규칙
  const nameReplacements = [
    [CURRENT_PROJECT_NAME, projectName],
    [CURRENT_PROJECT_NAME_NO_HYPHEN, projectNameNoHyphen],
    // turborepo 관련 레거시 이름도 치환
    ["turborepo-api", `${projectName}-api`],
    ["turborepo-web", `${projectName}-web`],
  ];

  // 파일 목록 수집
  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);

  console.log(`\n변경 대상 파일 검색 중... (${files.length}개 파일 발견)\n`);

  let changedFiles = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      let newContent = content;

      // 이름 치환
      newContent = replaceInContent(newContent, nameReplacements);

      // 포트 치환
      for (const [app, oldPort] of Object.entries(CURRENT_PORTS)) {
        newContent = replacePort(newContent, oldPort, newPorts[app]);
      }

      if (newContent !== content) {
        const relativePath = path.relative(rootDir, filePath);
        console.log(`  ✓ ${relativePath}`);

        if (!dryRun) {
          fs.writeFileSync(filePath, newContent, "utf8");
        }
        changedFiles++;
      }
    } catch (err) {
      console.error(`  ✗ ${filePath}: ${err.message}`);
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`총 ${changedFiles}개 파일 ${dryRun ? "변경 예정" : "변경됨"}`);

  if (!dryRun) {
    console.log(`\n다음 단계:`);
    console.log(`  1. pnpm install (의존성 재설치)`);
    console.log(`  2. git diff 로 변경사항 확인`);
    console.log(`  3. docker compose 재시작 (인프라 사용 시)`);
  }
}

main();
