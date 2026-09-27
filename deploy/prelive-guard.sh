#!/usr/bin/env bash
# Reads the prelive sync's `rsync --dry-run --itemize-changes` output on stdin
# and fails if that sync would delete or write anything production owns.
# The prelive key's forced root (rrsync -wo /opt/stacks/website/prelive) is all
# that keeps the sync out of production's files, and --delete makes a wrong root
# destructive. A dry run shows where the root really is, before anything is sent:
#
#   site/...     the root is /opt/stacks/website, which holds the live site/
#   Caddyfile    the live config, at any depth: a root higher still puts it deeper
#   status.json  at the top: only production's site/ has it, because cron writes
#                it there, so the root is the live site itself
#   .anything    a dotfile at the top: the build has none, so the root is a home
#                directory — a key line without command=, where --delete would
#                take .ssh/authorized_keys and lock out the production key too
set -euo pipefail

bad=$(awk '
  # An itemized line: an 11-character change string, a space, the path.
  # Deletions print "*deleting" padded to the same width.
  /^(\*deleting|[<>ch.][fdLDS])/ {
    path = substr($0, 13)
    sub(/ -> .*$/, "", path)
    name = path; sub(/\/$/, "", name); sub(/.*\//, "", name)
    # "./" is the root itself, not a dotfile. rsync itemizes it whenever its
    # mtime differs, which is every run: the build makes out/ fresh.
    if (path ~ /^site(\/|$)/ || name == "Caddyfile" || path == "status.json" || (path ~ /^\./ && path != "./")) print
  }')

if [ -n "$bad" ]; then
  echo "prelive-guard: the prelive sync would touch production's files, so the key's forced root is wrong. Nothing was sent:" >&2
  printf '%s\n' "$bad" >&2
  exit 1
fi
echo "prelive-guard: the sync stays inside the prelive root"
