#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# package.json에서 프로젝트 이름 추출
PROJECT_NAME=$(grep -o '"name": *"[^"]*"' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Could not extract project name from package.json"
  exit 1
fi

REMOTE_HOST="home-server"
REMOTE_BASE_DIR="/home/motiveko/envs/$PROJECT_NAME/apps"

echo "Project: $PROJECT_NAME"
echo "Remote: $REMOTE_HOST:$REMOTE_BASE_DIR"
echo ""

# apps 디렉토리 내 각 앱의 .env.production 파일 동기화
for app_dir in "$PROJECT_ROOT"/apps/*/; do
  app_name=$(basename "$app_dir")
  env_file="$app_dir.env.production"

  if [ -f "$env_file" ]; then
    remote_dir="$REMOTE_BASE_DIR/$app_name"

    echo "Syncing: $app_name/.env.production"

    # 원격 디렉토리 생성 후 파일 복사
    ssh "$REMOTE_HOST" "mkdir -p $remote_dir"
    rsync -av "$env_file" "$REMOTE_HOST:$remote_dir/.env.production"
  else
    echo "Skip: $app_name (no .env.production)"
  fi
done

echo ""
echo "Done!"
