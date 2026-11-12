/**
 * What /lab/ measures, and the one reading each figure falls back to.
 *
 * The live values come from the `lab` block of /status.json (lib/status.ts). A
 * metric with no dated reading shows that it is not published yet rather than a
 * number nobody measured.
 */
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
    what: "share of health checks that answered",
  },
  {
    key: "agentChecks",
    label: "Findings, agent-checks",
    what: "open findings across my repositories",
  },
];
