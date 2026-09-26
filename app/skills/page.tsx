import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import SkillsBoard from "@/components/SkillsBoard";
import { pageMetadata } from "@/lib/metadata";
import { getTopicUsage } from "@/lib/readings";

const description =
  "What I work with, and what my own editor measured over the last thirty days on the box I run myself.";

export const metadata: Metadata = pageMetadata({ title: "Skills", description, path: "/skills/" });

/**
 * /skills/ — a readout, not a diagram.
 *
 * It was a force graph, then a radial tree, and both were pictures of a claim
 * rather than evidence for it. Any developer can draw a graph of the words
 * they know. Almost none can show what their editor actually did this month on
 * a machine they run themselves, which is the only version of this page that
 * is hard to copy.
 *
 * There is no visible head at all. It carried a title, a figures line and a
 * lede explaining the bars, and all three were the page describing itself
 * before it showed anything. The nav already says which page this is and the
 * list is legible without any of it. What the bars are lives in the metadata
 * description, where a search result needs it and a reader who is already here
 * does not. The `<h1>` is still in the DOM — see PageHead's `quiet`.
 */
export default function Skills() {
  const linkable = getTopicUsage().map((t) => t.slug);

  return (
    <Shell className="skills-page">

      <PageHead title="Skills" quiet />

      <SkillsBoard linkable={linkable} />

    </Shell>
  );
}
