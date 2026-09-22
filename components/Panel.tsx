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
 * The shell is server-rendered and the numbers arrive after it. That is
 * deliberate: an element that appears late pushes everything under it down the
 * page, and this site's Cumulative Layout Shift has been 0 since it was built.
 * So the box is always there at its full height, and what changes inside it is
 * text.
 *
 * When the box is not publishing — no `/status.json`, a dead cron, or a
 * document more than two days old — the panel says so rather than showing a
 * row of dashes. An instrument that is not reading should say it is not
 * reading; zeroes would be a lie and an empty space would be a bug.
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

  return (
    <section className="panel" aria-label="Live figures from my own machine">
      <div className="panel-head">
        <span className="rail--label">Right now</span>
        <span className="panel-note">read from my own box, not typed</span>
      </div>
      <div className="panel-body">
        {!status ? (
          <p className="panel-empty">
            The box is not reporting tonight, so there is nothing here to show.
            Whatever this said an hour ago, it will not pretend it still holds.
          </p>
        ) : (
      <div className="panel-figs">
        <Fig
          value={status!.containers}
          label="containers"
          source="docker ps on one Hetzner box, via cron"
        />
        <Fig
          value={status!.uptimeDays}
          unit="d"
          label="uptime"
          source="the same box, since its last boot"
        />
        {status!.unhealthy > 0 && (
          <Fig value={status!.unhealthy} label="unhealthy" source="containers not in a running state" />
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
      </div>
    </section>
  );
}
