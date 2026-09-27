"use client";

import { useEffect, useState } from "react";

/**
 * `/status.json` — the only thing on this site that is true *now* rather than
 * true at build time.
 *
 * It is written by cron on the box (gen-status.sh, in homelab-gitops) and served next to
 * the static export. The build cannot produce any of it: CI has no view of what
 * is running, and the Wakapi it reads is on the tailnet.
 *
 * Aggregates only, deliberately — container counts, not container names;
 * language shares, not project names. The busiest project on my Wakapi is an
 * employer's codebase and its name is not mine to publish.
 *
 * **Every consumer must render without it.** It is missing in every local
 * build, missing in CI, and stale the moment that cron dies. `useStatus`
 * returns `undefined` until the fetch settles — which is also what the static
 * HTML and a reader without JavaScript get — and `null` when the document is
 * missing, stale or malformed.
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
export const MAX_AGE_HOURS = 48;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const strOrNull = (x: unknown): x is string | null => x === null || typeof x === "string";

function parseCoding(c: unknown): Status["coding"] {
  if (!isObj(c)) return null;
  const { hours, language, languagePercent, editor, editorPercent, languages } = c;
  if (!num(hours) || !num(languagePercent) || !num(editorPercent)) return null;
  if (!strOrNull(language) || !strOrNull(editor)) return null;
  const list =
    Array.isArray(languages) &&
    languages.every((l) => isObj(l) && typeof l.name === "string" && num(l.percent) && num(l.hours))
      ? (languages as { name: string; percent: number; hours: number }[])
      : undefined;
  return { hours, language, languagePercent, editor, editorPercent, languages: list };
}

function parsePackage(p: unknown): Status["package"] {
  if (!isObj(p)) return null;
  const { id, version, downloads } = p;
  if (typeof id !== "string" || typeof version !== "string" || !num(downloads)) return null;
  return { id, version, downloads };
}

/**
 * The document as the pages may trust it, or `null`.
 *
 * The file is written by a shell script on another machine, so nothing about
 * its shape is guaranteed: a field that drifted to a string would otherwise
 * reach a render and blank the page. A required field that fails rejects the
 * whole document; an optional block that fails is dropped on its own. The age
 * test is written so a date that does not parse fails closed.
 */
export function parseStatus(d: unknown, now: number = Date.now()): Status | null {
  if (!isObj(d) || typeof d.generated !== "string") return null;
  const ageHours = (now - Date.parse(d.generated)) / 36e5;
  if (!(ageHours <= MAX_AGE_HOURS)) return null;
  const { uptimeDays, containers, unhealthy } = d;
  if (!num(uptimeDays) || !num(containers) || !num(unhealthy)) return null;
  return {
    generated: d.generated,
    uptimeDays,
    containers,
    unhealthy,
    coding: parseCoding(d.coding),
    package: parsePackage(d.package),
  };
}

/**
 * One fetch per page load, shared by every component that asks. Three skills
 * and a rail all wanting the same figure should not be three requests for the
 * same file. A failed load is forgotten, so the next mount asks again.
 */
let inflight: Promise<Status | null> | null = null;

function load(): Promise<Status | null> {
  const p = (inflight ??= fetch("/status.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => parseStatus(d))
    .catch(() => null));
  p.then((s) => {
    if (s === null && inflight === p) inflight = null;
  });
  return p;
}

/** `undefined` while loading, `null` when there is nothing true to show. */
export function useStatus(): Status | null | undefined {
  const [status, setStatus] = useState<Status | null | undefined>(undefined);
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
