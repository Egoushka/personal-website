#!/usr/bin/env bash
# Serve ./out the way production does: deploy/Caddyfile in the Caddy image, on
# http://127.0.0.1:8080, in a container named `site`. It replaces any previous
# `site` on every call, because `next build` recreates out/ and a running
# container keeps the deleted one mounted, answering 404 for everything.
#
#   CADDY_IMAGE  image to run (default caddy:2-alpine; pin it to the box's)
#   SITE_PORT    host port (default 8080). Any other port runs as site-<port>,
#                so worktrees sharing one Docker daemon do not replace each other.
set -euo pipefail
cd "$(dirname "$0")/.."

image=${CADDY_IMAGE:-caddy:2-alpine}
port=${SITE_PORT:-8080}
name=site
[ "$port" = 8080 ] || name=site-$port

if [ ! -f out/index.html ]; then
  echo "serve-prod: out/index.html is missing; run npm run build first" >&2
  exit 1
fi

docker rm -f "$name" >/dev/null 2>&1 || true
docker run -d --name "$name" -p "127.0.0.1:$port:80" \
  -v "$PWD/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v "$PWD/out:/srv:ro" \
  "$image" >/dev/null

for _ in $(seq 1 30); do
  if curl -fs -o /dev/null "http://127.0.0.1:$port/"; then
    echo "serve-prod: $image serving ./out at http://127.0.0.1:$port (container $name)"
    exit 0
  fi
  # A Caddyfile that does not load stops the container; no point waiting.
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || break
  sleep 1
done
docker logs "$name" >&2 || true
echo "serve-prod: nothing answered on http://127.0.0.1:$port" >&2
exit 1
