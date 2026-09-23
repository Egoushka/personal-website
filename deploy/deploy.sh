#!/usr/bin/env bash
# Build the static site and ship it to the VPS by hand (CI does the same).
# Usage: ./deploy/deploy.sh
#
# The key logs in as `webdeploy`, whose only command is
# `rrsync -wo /opt/stacks/website`: remote paths are relative to that
# directory and only a write-only rsync works — no ssh commands, no docker.
# Caddy runs with --watch, so a new Caddyfile loads without a reload call.
set -euo pipefail

VPS="${VPS:-webdeploy@<origin-ip>}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building static export"
npm run build           # produces ./out (output: 'export')

echo "==> Syncing site content -> ${VPS}:site/"
# status.json is generated ON THE BOX by cron (gen-status.sh, in homelab-gitops) and is not
# part of the build output. Without the exclude, --delete removes it on every
# deploy and /uses/ silently loses its live state until the next cron tick.
rsync -avz --delete --exclude=status.json out/ "${VPS}:site/"

# compose.yaml is owned by the /opt/stacks GitOps repo, not this one.
# --inplace preserves the inode: Caddyfile is a single-file bind mount, and a
# rename-based write leaves the container pinned to the old inode forever.
echo "==> Syncing Caddy config"
rsync -avz --inplace deploy/Caddyfile "${VPS}:Caddyfile"

echo "==> Done. https://hrabovskyi.online"
