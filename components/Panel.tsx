"use client";

import { useStatus } from "@/lib/status";

/**
 * The instrument panel: what is true about this work tonight.
 *
 * This is the part of the site nobody else can copy. Anyone can write "I care
 * about observability"; this says how many containers are up, how many hours
 * went into an editor in the last month and what share of them were C#, and it
 * is wrong within a day if the box stops publishing.
 *
 * Hover or focus a figure and it says where the number came from. That is the
 * site's one rule — counted, never typed — turned from a footnote into the
 * interaction.
 *
 * The shell is server-rendered and the numbers arrive after it. The body
 * reserves the height the figures fill (see `.panel-body` in globals.css), so
 * what changes when they land is text, not the page's length.
 *
 * Three states, and they are not interchangeable. Before the fetch settles —
 * which is also what the static HTML, a crawler and a reader without
 * JavaScript get — the panel says where the figures come from and nothing
 * else. Only a fetch that failed, or a document that is missing, more than two
 * days old or malformed, gets the apology. An instrument that is not reading
 * should say so; one that has not been read yet must not claim it is down.
 *
 * A *thin* document — one that arrived without an optional half — gets a line
 * naming what is absent, because a silent gap in an instrument is
 * indistinguishable from a broken one.
 */

function Fig({
  value, unit, label, source,
}: { value: string | number; unit?: string; label: string; source: string }) {
  return (
    <span className="fig" tabIndex={0}>
      <span className="fig-value">
        {value}{unit && <em>{unit}</em>}
      </span>
      <span className="fig-label">{label}</span>
      <span className="fig-source">{source}</span>
    </span>
  );
}

export default function Panel() {
  const status = useStatus();
  const coding = status?.coding;
  const pkg = status?.package;

  /**
   * Optional halves of the document, named so the panel can say which one is
   * absent. `unhealthy` is not here: it is always written, and zero is a real
   * reading rather than a missing one.
   */
  const absent = [
    !(coding && coding.hours > 0) && "the editor hours",
    !pkg?.downloads && "the package count",
  ].filter((x): x is string => typeof x === "string");

  return (
    <section className="panel rounded-xl border bg-card p-5 md:p-6" aria-label="Live figures from my own machine" data-pagefind-ignore>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="live-dot" aria-hidden="true" /> Right now
        </p>
        <p className="text-xs text-muted-foreground">read from my own box, not typed</p>
      </div>
      <div className="panel-body mt-5">
        {status === undefined ? (
          <p className="max-w-prose text-sm text-muted-foreground">Figures from my own box load here.</p>
        ) : status === null ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            The box is not reporting tonight, so there is nothing here to show.
            Whatever this said an hour ago, it will not pretend it still holds.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            <Fig
              value={status.containers}
              label="containers"
              source="docker ps on one Hetzner box, via cron"
            />
            <Fig
              value={status.uptimeDays}
              unit="d"
              label="uptime"
              source="the same box, since its last boot"
            />
            {status.unhealthy > 0 && (
              <Fig value={status.unhealthy} label="unhealthy" source="containers not in a running state" />
            )}
            {coding && coding.hours > 0 && (
              <Fig
                value={coding.hours}
                unit="h"
                label="coded, 30 days"
                source="a Wakapi I host myself"
              />
            )}
            {coding?.language && (
              <Fig
                value={coding.languagePercent}
                unit="%"
                label={`of that was ${coding.language}`}
                source="Wakapi, per-language share"
              />
            )}
            {pkg?.downloads ? (
              <Fig
                value={pkg.downloads.toLocaleString("en-US")}
                label="NuGet installs"
                source={`nuget.org counts these, not me — ${pkg.id} ${pkg.version}`}
              />
            ) : null}
          </div>
        )}
        {status && absent.length > 0 && (
          <p className="mt-4 max-w-prose text-xs text-muted-foreground">
            Tonight's document arrived without {absent.join(" or ")}. Missing is
            not zero, so there is nothing in its place.
          </p>
        )}
      </div>
    </section>
  );
}
