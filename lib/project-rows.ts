/**
 * How the project index arranges its rows (app/projects/page.tsx builds them,
 * components/ProjectFilter.tsx shows them). Pure, so the grouping rules are
 * tested rather than read off a rendered page. No `fs`: a client component
 * imports it.
 */
export type ProjectRow = {
  slug: string;
  name: string;
  lang: string;
  shape: string;
  status: "running" | "building" | "paused";
  summary: string;
  visibility: "public" | "private";
  /** The public repository, when there is one. */
  repo?: string;
  /** How many posts name this project; the project page lists them. */
  posts: number;
  /** The first page of its docs, when it has docs (ADR 0006). */
  docs?: string;
  /** Built for other people to run, as opposed to for me. */
  featured: boolean;
  /** A featured project's measured figures, each read from its readings. */
  figures?: { label: string; value: string }[];
  topics: { slug: string; name: string }[];
};

/** The order and names of the groups a not-featured project falls into. */
export const STATES = [
  { status: "running", label: "Running" },
  { status: "building", label: "Building" },
  { status: "paused", label: "Paused" },
] as const;

/**
 * The figures a card shows: the first few readings short enough to take in at a
 * glance. A sentence belongs on the project page, and "Users" is a count of me.
 */
export function figuresOf(
  readings: { label: string; value: string }[],
  max = 3,
  maxChars = 30,
): { label: string; value: string }[] {
  return readings
    .filter((r) => r.label !== "Users" && r.value.length <= maxChars)
    .slice(0, max)
    .map(({ label, value }) => ({ label, value }));
}

/**
 * The rows a visitor sees: filtered by topic and by "public repository" (both
 * must hold), split into what other people can run and the rest by state, with
 * public repositories before private ones inside each state — code you can read
 * is the part you can check. Ties keep the order of lib/site.ts.
 */
export function groupProjects(
  rows: ProjectRow[],
  filter: { topic: string | null; publicOnly: boolean },
) {
  const shown = rows.filter(
    (p) =>
      (!filter.topic || p.topics.some((t) => t.slug === filter.topic)) &&
      (!filter.publicOnly || p.visibility === "public"),
  );
  const publicFirst = (list: ProjectRow[]) =>
    [...list].sort((a, b) => Number(b.visibility === "public") - Number(a.visibility === "public"));
  return {
    shown,
    featured: shown.filter((p) => p.featured),
    states: STATES.map(({ status, label }) => ({
      status,
      label,
      rows: publicFirst(shown.filter((p) => !p.featured && p.status === status)),
    })),
  };
}
