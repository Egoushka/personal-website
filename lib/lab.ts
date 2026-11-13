/**
 * What /lab/ measures, and the one reading each figure falls back to.
 *
 * The live values come from the `lab` block of /status.json (lib/status.ts). A
 * metric with no dated reading shows that it is not published yet rather than a
 * number nobody measured.
 */
import type { Lab } from "@/lib/status";

export type LabKey = "chargehand" | "rebuildDrill" | "nytka" | "agentChecks";

export type LabMetric = {
  key: LabKey;
  label: string;
  /** What the number is, in one line, for the tile's foot. */
  what: string;
  /** The last reading taken by hand, shown until the box publishes one. */
  fallback?: { value: string; read: string };
  /** What "good" is, when there is a stated target. */
  goal?: string;
};

export const LAB_METRICS: LabMetric[] = [
  {
    key: "chargehand",
    label: "Merge rate, chargehand",
    what: "unattended issue-to-PR batches that merged",
    // Counted by hand in the 45-repo review of 2026-11-01 (issue #77).
    fallback: { value: "8/30", read: "2026-11-01" },
    goal: "goal 0.6",
  },
  {
    key: "rebuildDrill",
    label: "Rebuild drill",
    what: "the box rebuilt from its repository, timed",
  },
  {
    key: "nytka",
    label: "Uptime, nytka",
    what: "share of health checks that passed",
  },
  {
    key: "agentChecks",
    label: "Findings, agent-checks",
    what: "open findings across my repositories",
  },
];

const day = (iso: string) => iso.slice(0, 10);

/** The tile's live value and note, or `undefined` when the box does not publish it. */
export function liveLab(key: LabKey, lab: Lab | null | undefined): { value: string; note: string } | undefined {
  if (!lab) return undefined;
  if (key === "chargehand" && lab.chargehand) {
    const c = lab.chargehand;
    return { value: `${c.merged}/${c.batches}`, note: `${(c.merged / c.batches).toFixed(2)} on ${day(c.asOf)}` };
  }
  if (key === "rebuildDrill" && lab.rebuildDrill)
    return { value: `${lab.rebuildDrill.minutes} min`, note: `last drill ${day(lab.rebuildDrill.asOf)}` };
  if (key === "nytka" && lab.nytka) {
    const d = lab.nytka.days;
    return { value: `${lab.nytka.uptimePercent.toFixed(2)}%`, note: d === 1 ? "last day" : `last ${d} days` };
  }
  if (key === "agentChecks" && lab.agentChecks)
    return { value: String(lab.agentChecks.findings), note: `as of ${day(lab.agentChecks.asOf)}` };
  return undefined;
}
