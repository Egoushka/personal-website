"use client";

import { useEffect, useState } from "react";

/**
 * `/status.json` — the only thing on this site that is true *now* rather than
 * true at build time.
 *
 * It is written by cron on the box (scripts/gen-status.sh) and served next to
 * the static export. The build cannot produce any of it: CI has no view of what
 * is running, and the Wakapi it reads is on the tailnet.
 *
 * Aggregates only, deliberately — container counts, not container names;
 * language shares, not project names. The busiest project on my Wakapi is an
 * employer's codebase and its name is not mine to publish.
 *
 * **Every consumer must render without it.** It is missing in every local
 * build, missing in CI, and stale the moment that cron dies. `useStatus`
 * returns null in all three cases and the pages are written to simply say less.
 */
export type Status = {
  generated: string;
  uptimeDays: number;
  containers: number;
  unhealthy: number;
  coding?: {
    hours: number;
    language: string | null;
    languagePercent: number;
    editor: string | null;
    editorPercent: number;
    /** Per-language shares, biggest first, anything under 1% dropped. */
    languages?: { name: string; percent: number; hours: number }[];
  } | null;
  package?: { id: string; version: string; downloads: number } | null;
};

/** A document older than this means the generator stopped; show nothing. */
const MAX_AGE_HOURS = 48;

/**
 * One fetch per page load, shared by every component that asks. Three skills
 * and a rail all wanting the same figure should not be three requests for the
 * same file.
 */
let inflight: Promise<Status | null> | null = null;

function load(): Promise<Status | null> {
  inflight ??= fetch("/status.json", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Status>) : null))
    .then((d) => {
      if (!d?.generated) return null;
      const ageHours = (Date.now() - Date.parse(d.generated)) / 36e5;
      return ageHours > MAX_AGE_HOURS ? null : d;
    })
    .catch(() => null);
  return inflight;
}

export function useStatus(): Status | null {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    let live = true;
    load().then((d) => {
      if (live) setStatus(d);
    });
    return () => {
      live = false;
    };
  }, []);
  return status;
}
