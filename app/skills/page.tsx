import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import SkillsBoard, { type BoardData } from "@/components/SkillsBoard";
import Icon from "@/components/Icon";
import { skills, practice, uses } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { getTopicUsage } from "@/lib/readings";

const description =
  "What I work with, and what my own editor measured over the last thirty days on the box I run myself.";

export const metadata: Metadata = pageMetadata({ title: "Skills", description, path: "/skills/" });

/**
 * /skills/ — a readout, not a diagram.
 *
 * Any developer can draw a graph of the words they know. Almost none can show
 * what their editor actually did this month on a machine they run
 * themselves, which is the only version of this page that is hard to copy.
 *
 * There is no visible head. The nav already says which page this is and the
 * list is legible without one; what the bars are lives in the metadata
 * description, where a search result needs it. The `<h1>` is still in the
 * DOM — see PageHead's `quiet`.
 *
 * The board is a client component for its filter, so it gets only the fields
 * it renders, with the icons already drawn: lib/site.ts and lib/icons.ts stay
 * on the server.
 */
export default function Skills() {
  // Only link a skill whose hub exists — the vocabulary is wider than the
  // pages it has earned.
  const hasPage = new Set<string>(getTopicUsage().map((t) => t.slug));

  const data: BoardData = {
    skills: skills.map((g) => ({
      group: g.group,
      items: g.items.map((s) => ({
        name: s.name,
        now: s.now,
        wakatime: s.wakatime,
        href: s.topic && hasPage.has(s.topic) ? `/topics/${s.topic}/` : undefined,
        icon: s.icon ? <Icon name={s.icon} /> : undefined,
      })),
    })),
    practice: practice.map((p) => ({ name: p.name, now: p.now })),
    uses: uses.map((g) => ({
      group: g.group,
      items: g.items.map((i) => ({ name: i.name, href: i.href })),
    })),
  };

  return (
    <Shell className="skills-page">

      <PageHead title="Skills" quiet />

      <SkillsBoard data={data} searchMark={<Icon name="search" />} />

    </Shell>
  );
}
