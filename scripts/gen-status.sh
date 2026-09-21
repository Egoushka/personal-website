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

# ── coding activity, optional ───────────────────────────────────────────────
# Aggregates from the Wakapi on this box, so /about/ can say what I actually
# work in rather than what I would like to be working in.
#
# Aggregates only, again: hours, the top language and the top editor, each as a
# share. NOT the project list — the biggest project is an employer's codebase
# and its name is not mine to publish. Every failure here is silent and leaves
# the field null; UsesStatus renders nothing when it is missing, so the page
# degrades to the static list rather than to a gap.
#
# Set WAKAPI_API_KEY in the cron environment to switch it on. WAKAPI_URL
# defaults to the container's address on the compose network.
CODING=null
if [ -n "${WAKAPI_API_KEY:-}" ]; then
  CODING="$(
    curl -sf -m 10 \
      -H "Authorization: Basic $(printf '%s' "$WAKAPI_API_KEY" | base64 -w0)" \
      "${WAKAPI_URL:-http://wakapi:3000}/api/compat/wakatime/v1/users/current/stats/last_30_days" \
    | python3 -c '
import json, sys
d = json.load(sys.stdin)["data"]
first = lambda k: (d.get(k) or [{}])[0]
lang, ed = first("languages"), first("editors")
hours = round(d.get("total_seconds", 0) / 3600)
if not hours:
    raise SystemExit(1)
print(json.dumps({
    "hours": hours,
    "language": lang.get("name"),
    "languagePercent": round(lang.get("percent", 0)),
    "editor": ed.get("name"),
    "editorPercent": round(ed.get("percent", 0)),
}))' 2>/dev/null || echo null
  )"
  [ -n "$CODING" ] || CODING=null
fi

{
  printf '{\n'
  printf '  "generated": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '  "uptimeDays": %s,\n' "$UP_DAYS"
  printf '  "containers": %s,\n' "$COUNT"
  printf '  "unhealthy": %s,\n' "$UNHEALTHY"
  printf '  "coding": %s\n' "$CODING"
  printf '}\n'
} > "$TMP"

# Validate before publishing: a truncated write would otherwise be served.
python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$TMP"

install -m 644 "$TMP" "$OUT"
echo "wrote $OUT ($COUNT containers, up ${UP_DAYS}d)"
