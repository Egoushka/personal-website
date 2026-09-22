import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import SkillsBoard from "@/components/SkillsBoard";
import { site, feedTypes } from "@/lib/site";
import { getTopicUsage } from "@/lib/readings";

const description =
  "What I work with, and what my own editor measured over the last thirty days on the box I run myself.";

export const metadata: Metadata = {
  title: "Skills",
  description,
  alternates: { canonical: "/skills/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Skills — ${site.name}`,
    description,
    url: `${site.url}/skills/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Skills — ${site.name}`, description },
};

/**
 * /skills/ — a readout, not a diagram.
 *
 * It was a force graph, then a radial tree, and both were pictures of a claim
 * rather than evidence for it. Any developer can draw a graph of the words
 * they know. Almost none can show what their editor actually did this month on
 * a machine they run themselves, which is the only version of this page that
 * is hard to copy.
 *
 * The head is a title and nothing else. It carried a figures line and a lede
 * explaining the bars; both were a page describing itself before it showed
 * anything, and the list is legible without either. What the bars are is in
 * the metadata description, where a search result needs it and a reader who is
 * already here does not.
 */
export default function Skills() {
  const linkable = getTopicUsage().map((t) => t.slug);

  return (
    <main id="main" className="wrap skills-page">
      <Nav current="skills" />

      <PageHead title="Skills" />

      <SkillsBoard linkable={linkable} />

      <Footer />
    </main>
  );
}
