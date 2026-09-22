import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import SkillsBoard from "@/components/SkillsBoard";
import { site, feedTypes, skills } from "@/lib/site";
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
 * The figures line counts groups and says what the bars are not. It used to
 * count the skills too — a total is the one number on this page that invites
 * the reader to compare it with somebody else's, which is the opposite of the
 * argument the page is making.
 */
export default function Skills() {
  const linkable = getTopicUsage().map((t) => t.slug);

  return (
    <main id="main" className="wrap skills-page">
      <Nav current="skills" />

      <PageHead
        title="Skills"
        figures={
          <>
            <span>{skills.length} groups</span>
            <span>measured, not rated</span>
          </>
        }
        lede="What I would put my name to. The bars are real: they are the share of my editor time over the last thirty days, read from a Wakapi on my own box, and most rows do not have one because most work is not a language a plugin can see."
      />

      <SkillsBoard linkable={linkable} />

      <Footer />
    </main>
  );
}
