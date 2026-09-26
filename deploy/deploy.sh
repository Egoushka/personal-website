#!/usr/bin/env bash
# Deploy by hand what .github/workflows/deploy.yml deploys, behind the same
# gate: a committed tree, a production build, every check the workflow runs
# before it touches the box, the same three-pass sync, and the same check of
# the live site afterwards.
# Usage: ./deploy/deploy.sh
#
# The key logs in as `webdeploy`, whose only command is
# `rrsync -wo /opt/stacks/website`: remote paths are relative to that
# directory and only a write-only rsync works — no ssh commands, no docker.
# Caddy runs with --watch, so a new Caddyfile loads without a reload call.
# No Cloudflare purge here: HTML reaches readers when the edge's copy expires
# (s-maxage=600).
set -euo pipefail

VPS="${VPS:-webdeploy@<origin-ip>}"
SITE="https://hrabovskyi.online"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Refusals first, before anything runs.
if [ -n "${SITE_URL:-}" ]; then
  echo "deploy.sh: refusing: SITE_URL is set ($SITE_URL). That builds the site for another origin; production is built without it." >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "deploy.sh: refusing: the working tree has changes. Deploy a commit, not a working copy:" >&2
  git status --short >&2
  exit 1
fi

echo "==> Checks"
npm run validate
npm run typecheck
npm test
npm run build
npm run check
docker run --rm -v "$ROOT/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  "${CADDY_IMAGE:-caddy:2-alpine}" caddy validate --config /etc/caddy/Caddyfile
bash scripts/caddy-test.sh

rev="$(git rev-parse HEAD)"
caddyfile="$(mktemp)"
trap 'rm -f "$caddyfile"' EXIT
sed "s/__DEPLOY_REV__/$rev/" deploy/Caddyfile > "$caddyfile"
grep -qF "X-Site-Rev \"$rev\"" "$caddyfile"
chmod 644 "$caddyfile" # -a carries the mode to the box; mktemp makes it 600

# The passes and their order are deploy.yml's; the reasons are there too.
echo "==> Syncing $rev to $VPS"
rsync -azi out/_next/ "$VPS:site/_next/"
rsync -azi --inplace "$caddyfile" "$VPS:Caddyfile"
rsync -azi --delete --exclude=/status.json --exclude=/_next/ out/ "$VPS:site/"

echo "==> Verifying $SITE"
BASE_URL="$SITE" EXPECT_REV="$rev" bash scripts/caddy-test.sh
