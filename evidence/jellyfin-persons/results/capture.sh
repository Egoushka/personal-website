#!/usr/bin/env bash
# usage: capture.sh <variant> <path to PeopleBench.dll>
# Writes query-<variant>.sql (the EF-generated page query), plan-<variant>.txt (SQLite's plan for it)
# and dump-<variant>.txt (row counts and a hash of every page, at 1,000 and 5,000 rows).
set -euo pipefail
v=$1; dll=$2; out=$(dirname "$0")
PEOPLEBENCH_SQL=1 dotnet "$dll" dump 1000 2>&1 | python3 -c "
import sys,re
for b in re.split(r'\ninfo: ', sys.stdin.read()):
    if 'ORDER BY lower' in b and 'LIMIT' in b:
        t=b.split(\"CommandTimeout='30']\n\",1)[1]
        print(re.sub(r'\s+',' ',t).strip()); break
" > "$out/query-$v.sql"
dotnet "$dll" plan 1000 "$(cat "$out/query-$v.sql")" > "$out/plan-$v.txt"
{ dotnet "$dll" dump 1000; dotnet "$dll" dump 5000; } 2>&1 | grep -E "^(rows|all pages)" > "$out/dump-$v.txt"
