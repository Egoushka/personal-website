"use client";

import { useStatus } from "@/lib/status";

type Pick = "downloads" | "containers" | "uptime";

/**
 * One figure that is the dated value until /status.json answers, then the live
 * one. A missing or stale file keeps the dated value, so the figure never goes
 * blank and never claims to be fresher than it is.
 */
export default function StatusFig({ pick, fallback }: { pick: Pick; fallback: string }) {
  const s = useStatus();
  let live: string | undefined;
  if (s) {
    if (pick === "downloads" && s.package) live = String(s.package.downloads);
    if (pick === "containers") live = String(s.containers);
    if (pick === "uptime") live = `${s.uptimeDays} d`;
  }
  return <>{live ?? fallback}</>;
}
