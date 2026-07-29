#!/usr/bin/env bash
# Build the static site and ship it to the VPS.
# Usage: ./deploy/deploy.sh
set -euo pipefail

VPS="${VPS:-root@<origin-ip>}"
REMOTE_DIR="${REMOTE_DIR:-/opt/stacks/website}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building static export"
npm run build           # produces ./out (output: 'export')

echo "==> Syncing site content -> ${VPS}:${REMOTE_DIR}/site"
ssh "$VPS" "mkdir -p ${REMOTE_DIR}/site"
# status.json is generated ON THE BOX by cron (scripts/gen-status.sh) and is not
# part of the build output. Without the exclude, --delete removes it on every
# deploy and /uses/ silently loses its live state until the next cron tick.
rsync -avz --delete --exclude=status.json out/ "${VPS}:${REMOTE_DIR}/site/"

# compose.yaml is owned by the /opt/stacks GitOps repo, not this one.
# --inplace preserves the inode: Caddyfile is a single-file bind mount, and a
# rename-based write leaves the container pinned to the old inode forever.
echo "==> Syncing Caddy config"
rsync -avz --inplace deploy/Caddyfile "${VPS}:${REMOTE_DIR}/"

echo "==> Bringing the stack up"
ssh "$VPS" "cd ${REMOTE_DIR} && docker compose up -d && \
  docker exec website-caddy caddy reload --config /etc/caddy/Caddyfile"

echo "==> Done. https://hrabovskyi.online"
