"use client";

import { useStatus } from "@/lib/status";

/**
 * The measured share of my editor time for one language, printed beside the
 * claim it corroborates.
 *
 * This is the argument the rest of the skills list cannot make. "Five years of
 * C#" is a sentence anyone can type; "54% of my editor time in the last 30
 * days, from a Wakapi I host myself" is a number that would embarrass me if it
 * were wrong, and it changes on its own every night.
 *
 * Renders **nothing** when the figure is missing — no box, no placeholder, no
 * "—". The list reads correctly as prose without it, which is the condition
 * for a client component existing on this site at all.
 */
export default function Measured({ lang }: { lang: string }) {
  const status = useStatus();
  const row = status?.coding?.languages?.find((l) => l.name === lang);
  if (!row) return null;

  return (
    <span className="measured">
      {row.percent}% of the last 30 days
    </span>
  );
}

/**
 * Downloads of the published package. Counted by NuGet, which is the point:
 * it is the only figure on this site that someone else keeps.
 */
export function Downloads() {
  const status = useStatus();
  const pkg = status?.package;
  if (!pkg?.downloads) return null;

  return (
    <li className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">Downloads</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{pkg.downloads.toLocaleString("en-US")}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">nuget.org, read tonight — version {pkg.version}</p>
    </li>
  );
}
