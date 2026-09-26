#!/usr/bin/env bash
# What deploy/Caddyfile does to a real build, asserted over HTTP: redirects,
# card content types, misses, the CSP, cache headers. `next build` and
# `caddy validate` see none of it.
#
#   bash scripts/caddy-test.sh
#       serves ./out through scripts/serve-prod.sh and tests that.
#   BASE_URL=https://hrabovskyi.online [EXPECT_REV=<commit>] bash scripts/caddy-test.sh
#       tests a live site. With EXPECT_REV it first waits up to 60 s for
#       X-Site-Rev to name that commit, i.e. for Caddy to load the new Caddyfile.
#       Exact Cache-Control values are asserted locally only: Cloudflare may
#       rewrite them, and the local run already proved this file sets them.
#
# Every request carries its own cache-busting query, so a live run reads the
# origin, not an edge copy, even for a URL it asks for twice. Caddy's path
# matchers ignore the query. A failure prints what was expected and what came
# back, and the exit status is non-zero if anything failed.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

if [ -n "${BASE_URL:-}" ]; then
  base=${BASE_URL%/}
  live=1
else
  bash scripts/serve-prod.sh || exit 1
  base=http://127.0.0.1:${SITE_PORT:-8080}
  live=
fi
run="$(date +%s)$$"
n=0
failed=0
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# GET $1. Leaves the status in $code, the resolved Location in $loc, headers in
# $tmp/h and the body in $tmp/b.
get() {
  local w
  n=$((n + 1))
  w=$(curl -sS --connect-timeout 10 --max-time 30 -o "$tmp/b" -D "$tmp/h" \
    -w '%{http_code} %{redirect_url}' "$base$1?cb=$run-$n" 2>"$tmp/err") || w="000 $(tr '\n' ' ' <"$tmp/err")"
  code=${w%% *}
  loc=${w#* }
}
# Every value of response header $1, one per line.
hdr() { grep -i "^$1:" "$tmp/h" | cut -d: -f2- | sed 's/^ *//; s/\r$//'; }

ok() { printf 'ok    %s\n' "$1"; }
fail() {
  printf 'FAIL  %s\n      expected: %s\n      got:      %s\n' "$1" "$2" "$3"
  failed=$((failed + 1))
}
same() { if [ "$2" = "$3" ]; then ok "$1"; else fail "$1" "$2" "$3"; fi; }

echo "caddy-test: $base"

# Which revision is answering. A deploy stamps its commit into the Caddyfile;
# until X-Site-Rev names it, Caddy is still running the previous file.
get /
rev=$(hdr x-site-rev)
if [ -n "${EXPECT_REV:-}" ]; then
  deadline=$((SECONDS + 60))
  while [ "$rev" != "$EXPECT_REV" ] && [ "$SECONDS" -lt "$deadline" ]; do
    sleep 2
    get /
    rev=$(hdr x-site-rev)
  done
  same "X-Site-Rev names the deployed commit" "$EXPECT_REV" "${rev:-(no header, $code)}"
elif [ -n "$live" ]; then
  if [[ $rev =~ ^[0-9a-f]{40}$ ]]; then
    ok "X-Site-Rev names a commit ($rev)"
  else
    fail "X-Site-Rev names a commit" "a 40-hex commit id" "${rev:-(no header, $code)}"
  fi
elif [ -n "$rev" ]; then
  ok "X-Site-Rev is set ($rev)"
else
  fail "X-Site-Rev is set" "the header" "(no header, $code)"
fi

# Next writes the build id into every page's RSC payload, so this proves / is
# the build in ./out — on a live run, that the deploy is what is serving.
if [ -f .next/BUILD_ID ]; then
  id=$(cat .next/BUILD_ID)
  get /
  if grep -qF -- "$id" "$tmp/b"; then
    ok "/ is this build ($id)"
  else
    fail "/ is this build" "build id $id in the HTML" "$code, another build"
  fi
fi

for path in / /writing/ /projects/ /about/ /cv/ /writing/silent-deploys/ /feed.xml; do
  get "$path"
  same "$path answers" 200 "$code"
done

# A static export cannot redirect, so old addresses live here or they 404.
# The /posts/ ones are in feed readers.
moved() {
  get "$1"
  same "$1 redirects to $2" "301 $base$2" "$code $loc"
}
moved /blog/ /writing/
moved /posts/silent-deploys/ /writing/silent-deploys/
moved /posts/silent-deploys/opengraph-image /writing/silent-deploys/opengraph-image
moved /tags/debugging/ /topics/debugging/
moved /resume/ /cv/
moved /now/ /about/
moved /uses/ /about/
moved /links/ /about/

# next/og writes cards without an extension; only the Caddyfile makes them PNGs.
for path in /opengraph-image /writing/silent-deploys/opengraph-image /projects/attest/opengraph-image; do
  get "$path"
  same "$path is a PNG" "200 image/png" "$code $(hdr content-type)"
done

# A miss stays a miss: a 404 that is neither typed as a card nor cached as
# immutable.
miss() {
  get "$1"
  if [ "$code" = 404 ] && ! grep -qi '^content-type: *image/png' "$tmp/h" &&
    ! grep -qi '^cache-control:.*immutable' "$tmp/h"; then
    ok "$1 is a plain 404"
  else
    fail "$1 is a plain 404" "404, not image/png, not immutable" \
      "$code, $(hdr content-type | head -1), $(hdr cache-control | head -1)"
  fi
}
miss /writing/no-such-post/opengraph-image
miss /_next/static/chunks/no-such-chunk.js
miss /no-such-page/

# One CSP header, exactly as deploy/Caddyfile writes it, and the properties it
# must keep whatever else changes in it.
want=$(sed -n 's/^[[:space:]]*Content-Security-Policy "\(.*\)"$/\1/p' deploy/Caddyfile)
get /
csp=$(hdr content-security-policy)
if [ -z "$want" ]; then
  fail "the CSP is readable from deploy/Caddyfile" 'Content-Security-Policy "…" on one line' "no such line"
else
  same "one CSP header, as deploy/Caddyfile writes it" "$want" "${csp:-(none)}"
fi
case $csp in
  *"frame-ancestors 'none'"*) ok "the CSP forbids framing" ;;
  *) fail "the CSP forbids framing" "frame-ancestors 'none'" "${csp:-(none)}" ;;
esac
case $csp in
  *upgrade-insecure-requests*) fail "the CSP leaves http alone" "no upgrade-insecure-requests" "$csp" ;;
  *) ok "the CSP leaves http alone" ;;
esac
case $csp in
  *"'unsafe-eval'"*) fail "the CSP forbids eval" "no 'unsafe-eval' ('wasm-unsafe-eval' is fine)" "$csp" ;;
  *) ok "the CSP forbids eval" ;;
esac

if [ -z "$live" ]; then
  html="public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
  get /
  same "HTML caches at the edge, revalidates in browsers" "$html" "$(hdr cache-control)"
  asset=$(grep -o '/_next/static/[^"]*\.js' "$tmp/b" | head -1)
  if [ -z "$asset" ]; then
    fail "a hashed asset is immutable" "a /_next/static/ script in /" "none"
  else
    get "$asset"
    same "a hashed asset is immutable ($asset)" "200 public, max-age=31536000, immutable" "$code $(hdr cache-control)"
  fi
  get /index.txt
  same "an RSC payload caches like HTML" "200 $html" "$code $(hdr cache-control)"
  get /robots.txt
  same "robots.txt caches like the feeds" \
    "200 public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" "$code $(hdr cache-control)"
fi

# robots.txt must not shut crawlers out. Cloudflare prepends a managed block
# that disallows / for named AI crawlers, so only a group that applies to
# User-agent: * counts.
get /robots.txt
blocked=$(tr -d '\r' <"$tmp/b" | awk '
  { sub(/#.*/, "") }
  !index($0, ":") { next }
  {
    key = tolower($0); sub(/[ \t]*:.*/, "", key); sub(/^[ \t]+/, "", key)
    val = $0; sub(/^[^:]*:[ \t]*/, "", val); sub(/[ \t]+$/, "", val)
  }
  key == "user-agent" { if (rules) { star = 0; rules = 0 }; if (val == "*") star = 1; next }
  { rules = 1 }
  key == "disallow" && val == "/" && star { print "Disallow: / under User-agent: *"; exit }')
if [ "$code" = 200 ] && [ -z "$blocked" ]; then
  ok "robots.txt lets crawlers in"
else
  fail "robots.txt lets crawlers in" "200, no Disallow: / under User-agent: *" "$code ${blocked:-}"
fi

echo
if [ "$failed" -gt 0 ]; then
  echo "caddy-test: $failed check(s) failed against $base"
  exit 1
fi
echo "caddy-test: all checks passed against $base"
