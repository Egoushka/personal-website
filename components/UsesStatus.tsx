"use client";

import { useStatus } from "@/lib/status";

/**
 * Live state of the box, in the /about/ rail.
 *
 * This is the honest version of "make the page interactive". A filter box over
 * thirteen static rows would be theatre — it would never filter anything. What
 * makes a stack page worth reading is whether it is *true right now*, so the
 * page fetches what is actually running instead of asserting it.
 *
 * The document, its freshness rule and the shared fetch live in lib/status.ts.
 * Fails silently and completely: no /status.json, no cron, or a document older
 * than two days, and this renders nothing at all.
 */
export default function UsesStatus() {
  const status = useStatus();
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
