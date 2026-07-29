#!/usr/bin/env bash
#
# Writes the public status document served at /status.json.
#
# Runs ON THE VPS, from cron. Deliberately NOT part of the site build: the site
# is a static export produced by CI, which has no view of what is running.
#
# ── What is published, and what is not ──────────────────────────────────────
# Published:   container count, how many are unhealthy, host uptime, timestamp.
# NOT published: SERVICE NAMES, image versions or digests, ports, internal
#                hostnames, IPs, env, or anything from a .env file.
#
# The first draft of this script emitted every container name. Running it
# returned 108 of them — agent-runner, cloudflared, vaultwarden, adguardhome and
# the rest. Six services named in an architecture diagram is an explanation;
# 108 enumerated in a machine-readable document is a map of the attack surface,
# published on a box whose address is already known. Aggregates carry the whole
# signal a reader wants ("it's alive, and he isn't lying about running it")
# and none of the targeting information.
#
# Versions are the same argument one step further: "Vaultwarden 1.32.1" is a CVE
# list. If you extend this script, aggregate — never enumerate.
#
set -euo pipefail

OUT="${1:?usage: gen-status.sh /path/to/status.json}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# Uptime in whole days. `-s` is the boot time, which is stable across timezones.
BOOT_EPOCH="$(date -d "$(uptime -s)" +%s)"
UP_DAYS=$(( ( $(date +%s) - BOOT_EPOCH ) / 86400 ))

# Only containers with a compose project label — anything hand-started is not
# part of the declared stack and has no business being advertised.
# Counts only — see the note above. `--format '{{.State}}'` deliberately never
# reads .Names, so a careless edit cannot leak them back in.
STATES="$(docker ps --filter 'label=com.docker.compose.project' --format '{{.State}}')"
COUNT="$(printf '%s\n' "$STATES" | grep -c . || true)"
UNHEALTHY="$(printf '%s\n' "$STATES" | grep -cv '^running$' || true)"

{
  printf '{\n'
  printf '  "generated": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '  "uptimeDays": %s,\n' "$UP_DAYS"
  printf '  "containers": %s,\n' "$COUNT"
  printf '  "unhealthy": %s\n' "$UNHEALTHY"
  printf '}\n'
} > "$TMP"

# Validate before publishing: a truncated write would otherwise be served.
python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$TMP"

install -m 644 "$TMP" "$OUT"
echo "wrote $OUT ($COUNT containers, up ${UP_DAYS}d)"
