"use client";

import { useEffect, useState } from "react";

/**
 * Live state of the box, in the /uses/ rail.
 *
 * This is the honest version of "make the page interactive". A filter box over
 * thirteen static rows would be theatre — it would never filter anything. What
 * makes a uses page worth reading is whether it is *true right now*, so the
 * page fetches what is actually running instead of asserting it.
 *
 * Fails silently and completely. `/status.json` is written by cron on the VPS
 * (scripts/gen-status.sh); it does not exist in a local build, and it will be
 * stale or missing if that cron dies. The static list below is the real content
 * and stands alone — this only ever adds.
 */

/**
 * Aggregates only. The generator deliberately does not emit service names — see
 * the note at the top of scripts/gen-status.sh.
 */
type Status = {
  generated: string;
  uptimeDays: number;
  containers: number;
  unhealthy: number;
  /**
   * Last 30 days from the Wakapi on the same box. Null whenever the generator
   * could not read it, which is why every line below is guarded: a stack page
   * claiming measured hours it does not have would be worse than a quiet one.
   */
  coding?: {
    hours: number;
    language: string | null;
    languagePercent: number;
    editor: string | null;
    editorPercent: number;
  } | null;
};

export default function UsesStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/status.json", { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Status | null) => {
        // A document older than two days means the generator stopped. Showing
        // nothing is better than showing a number that quietly went wrong.
        if (!d?.generated) return;
        const ageHours = (Date.now() - Date.parse(d.generated)) / 36e5;
        if (ageHours > 48) return;
        setStatus(d);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  if (!status) return null;

  return (
    <span className="rail--group uses-status">
      <span className="rail--label">Right now</span>
      <span>{status.containers} containers</span>
      <span>up {status.uptimeDays} days</span>
      <span className={status.unhealthy ? "uses-status-bad" : "uses-status-ok"}>
        {status.unhealthy ? `${status.unhealthy} unhealthy` : "all healthy"}
      </span>
      {status.coding && status.coding.hours > 0 && (
        <>
          <span>{status.coding.hours} h coding, 30 days</span>
          {status.coding.language && (
            <>
              <span>{status.coding.language} {status.coding.languagePercent}%</span>
              {status.coding.editor && (
                <span>{status.coding.editor} {status.coding.editorPercent}%</span>
              )}
            </>
          )}
        </>
      )}
    </span>
  );
}
