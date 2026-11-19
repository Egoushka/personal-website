import fs from "node:fs";
import path from "node:path";
import { checkAgainstSchema, loadRadarSchema } from "./radar-schema.mjs";

export const RINGS = ["adopt", "trial", "assess", "hold"] as const;
export const QUADRANTS = ["infra", "data", "tooling", "process"] as const;
export type Ring = (typeof RINGS)[number];
export type Quadrant = (typeof QUADRANTS)[number];

export type RadarEntry = {
  name: string;
  quadrant: Quadrant;
  ring: Ring;
  since: string;
  reason: string;
  result?: string;
  repoKind: "personal";
};

export const RING_MEANING: Record<Ring, string> = {
  adopt: "In use, and I would pick it again.",
  trial: "Running on a branch or one project, with a measured result.",
  assess: "Worth reading about; nothing run yet.",
  hold: "Tried or read, and not now. The result says why.",
};

/** Entries of a radar document, newest first inside a ring. Throws if it breaks the schema, so the build fails. */
export function parseRadar(doc: unknown): RadarEntry[] {
  const problems = checkAgainstSchema(doc, loadRadarSchema());
  if (problems.length) throw new Error(`content/radar.json: ${problems.join("; ")}`);
  const entries = (doc as { entries: RadarEntry[] }).entries;
  return [...entries].sort((a, b) => b.since.localeCompare(a.since) || a.name.localeCompare(b.name));
}

export function getRadar(): RadarEntry[] {
  const file = path.join(process.cwd(), "content", "radar.json");
  return parseRadar(JSON.parse(fs.readFileSync(file, "utf8")));
}

export function byRing(entries: RadarEntry[]): Record<Ring, RadarEntry[]> {
  return Object.fromEntries(RINGS.map((r) => [r, entries.filter((e) => e.ring === r)])) as Record<Ring, RadarEntry[]>;
}
