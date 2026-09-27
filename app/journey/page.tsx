import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import Journey, { type JourneyRow } from "@/components/Journey";
import Icon from "@/components/Icon";
import { experience, eras } from "@/lib/site";
import { topicName } from "@/lib/topics";
import { formatSpan, yearFraction, yearFractionEnd } from "@/lib/dates";
import { n } from "@/lib/readings";
import { getSpanDays, inWords } from "@/lib/posts";
import { pageMetadata } from "@/lib/metadata";

/**
 * /journey/ — the record as a shape.
 *
 * The CV tells this as chapters and the stack tells it as a readout; this
 * tells it as a length of time, which is the only telling where the gaps are
 * visible. Each bar links back to the chapter it belongs to, so the page is a
 * way into the CV rather than a second copy of it.
 *
 * Every figure is worked out here, at build, from `experience[].start`/`end`
 * and `experience[].topics` — the fields the CV reads. The client component
 * gets percentages and strings, and nothing else from lib/site.ts.
 *
 * It shows the **gaps**, and they are the point: two months selling
 * logistics, a summer with no employer, a freelance year with no public
 * artefact. A CV closes those by listing only the good parts; a timeline
 * cannot. Only paid roles are drawn: projects have no dates on record.
 */

// The axis ends today. The build clock is the only clock this site has.
const built = new Date();
const nowYear = built.getFullYear() + built.getMonth() / 12;

const roles = experience
  .map((job) => ({
    label: job.company,
    detail: job.role,
    when: formatSpan(job),
    start: yearFraction(job.start),
    // `end` is the last month worked, so the bar runs to the end of it.
    end: job.end === null ? nowYear : yearFractionEnd(job.end),
    tags: job.topics.map(topicName),
    era: eras.find((e) => e.jobs.includes(job.company))?.slug,
  }))
  .sort((x, y) => x.start - y.start);

const from = Math.floor(Math.min(...roles.map((r) => r.start)));
const to = Math.ceil(nowYear);
const pct = (v: number) => ((v - from) / (to - from)) * 100;

// The stretches with no employer at all, computed from the same dates rather
// than written down, so they cannot be quietly dropped. Half a month of slack
// absorbs floating-point noise between one role's end and the next's start.
const gaps: { start: number; end: number }[] = [];
let reach = roles[0]?.end ?? nowYear;
for (const r of roles.slice(1)) {
  if (r.start > reach + 1 / 24) gaps.push({ start: reach, end: r.start });
  reach = Math.max(reach, r.end);
}

const years = roles.reduce((sum, r) => sum + (r.end - r.start), 0);

const description = `${n(Math.floor(nowYear - from))} years on a time axis: every paid role, what it was built with, and the months in between with no employer at all.`;

export const metadata: Metadata = pageMetadata({ title: "Journey", description, path: "/journey/" });

export default function JourneyPage() {
  const rows: JourneyRow[] = roles.map((r) => ({
    label: r.label,
    detail: r.detail,
    when: r.when,
    left: pct(r.start),
    width: Math.max(pct(r.end) - pct(r.start), 1.2),
    tags: r.tags,
    era: r.era,
  }));

  const axis = {
    years: Array.from({ length: to - from + 1 }, (_, i) => ({ year: from + i, left: pct(from + i) })),
    gaps: gaps.map((g) => ({ left: pct(g.start), width: pct(g.end) - pct(g.start) })),
    now: pct(nowYear),
  };

  return (
    <Shell>

      <PageHead
        title="Journey"
        quiet
        figures={
          <>
            <span>{from} — now</span>{" "}
            <span>{n(roles.length)} roles</span>{" "}
            <span>gaps included</span>
          </>
        }
        lede="Not the stack — how it was acquired. Every bar is a date from the record, every tag a technology that role actually used, and the shaded stretches are the months with no employer."
      />

      <Journey
        rows={rows}
        axis={axis}
        idle={`${n(roles.length)} paid roles, ${years.toFixed(1)} years of them, and the gaps in between`}
      >
        <p className="jr-note">
          <Icon name="job" /> Every bar is a date from the record and every tag a
          technology that role actually used — the same fields the CV reads. The
          shaded stretches are months with no employer: two of them are a
          freelance year and a deliberate detour into sales, and they are on the
          page for the same reason the {inWords(getSpanDays("silent-deploys"))} days are.
        </p>
      </Journey>

      <p className="page-figures">
        <span>The same record, told as chapters, is on <Link prefetch={false} href="/cv/">the CV</Link>.</span>
      </p>

    </Shell>
  );
}
