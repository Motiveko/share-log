#!/usr/bin/env bash
set -euo pipefail

LOCAL_FILE="$(dirname "$0")/docker-compose-server.yml"
REMOTE="home-server:~/docker/docker-compose-server.yml"

rsync -avz "$LOCAL_FILE" "$REMOTE"
