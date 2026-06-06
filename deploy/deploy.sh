#!/usr/bin/env bash
# Build the static site and ship it to the VPS.
# Usage: ./deploy/deploy.sh
set -euo pipefail

VPS="${VPS:-root@37.27.211.58}"
REMOTE_DIR="${REMOTE_DIR:-/opt/stacks/website}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building static export"
npm run build           # produces ./out (output: 'export')

echo "==> Syncing site content -> ${VPS}:${REMOTE_DIR}/site"
ssh "$VPS" "mkdir -p ${REMOTE_DIR}/site"
rsync -avz --delete out/ "${VPS}:${REMOTE_DIR}/site/"

echo "==> Syncing Caddy config + compose"
rsync -avz deploy/Caddyfile deploy/docker-compose.yml "${VPS}:${REMOTE_DIR}/"

echo "==> Bringing the stack up"
ssh "$VPS" "cd ${REMOTE_DIR} && docker compose up -d"

echo "==> Done. https://hrabovskyi.online"
