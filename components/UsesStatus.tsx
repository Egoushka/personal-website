"use client";

import { useStatus } from "@/lib/status";

/**
 * Live state of the box, in the /about/ rail.
 *
 * This is the honest version of "make the page interactive". A filter box over
 * static rows would be theatre — it would never filter anything. What
 * makes a stack page worth reading is whether it is *true right now*, so the
 * page fetches what is actually running instead of asserting it.
 *
 * The document, its freshness rule and the shared fetch live in lib/status.ts.
 * Renders nothing while loading, and nothing when there is no /status.json,
 * no cron, or a document older than two days.
 */
export default function UsesStatus() {
  const status = useStatus();
  if (!status) return null;

  return (
    <div className="uses-status mt-5 border-t pt-4 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <span className="live-dot" aria-hidden="true" /> Right now
      </p>
      <ul className="mt-2 space-y-1 text-muted-foreground tabular-nums">
        <li>{status.containers} containers, up {status.uptimeDays} days</li>
        <li className={status.unhealthy ? "text-destructive" : undefined}>
          {status.unhealthy ? `${status.unhealthy} unhealthy` : "all healthy"}
        </li>
        {status.coding && status.coding.hours > 0 && (
          <li>
            {status.coding.hours} h coding in 30 days
            {status.coding.language && <>, {status.coding.language} {status.coding.languagePercent}%</>}
            {status.coding.language && status.coding.editor && <>, {status.coding.editor} {status.coding.editorPercent}%</>}
          </li>
        )}
      </ul>
    </div>
  );
}
