import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import StackBoard from "@/components/StackBoard";
import { site, feedTypes, skills } from "@/lib/site";
import { getTopicUsage } from "@/lib/readings";

const description =
  "Every skill I would put my name to, as a readout: what I use, what my own editor measured this month, and what runs on the box it is all hosted on.";

export const metadata: Metadata = {
  title: "Stack",
  description,
  alternates: { canonical: "/stack/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Stack — ${site.name}`,
    description,
    url: `${site.url}/stack/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Stack — ${site.name}`, description },
};

/**
 * /stack/ — an instrument, not a diagram.
 *
 * It was a force graph, then a radial tree, and both were pictures of a claim
 * rather than evidence for it. Any developer can draw a graph of the words
 * they know. Almost none can show what their editor actually did this month on
 * a machine they run themselves, which is the only version of this page that
 * is hard to copy.
 */
export default function Stack() {
  const count = skills.reduce((n, g) => n + g.items.length, 0);
  const linkable = getTopicUsage().map((t) => t.slug);

  return (
    <main id="main" className="wrap stack-page">
      <Nav current="stack" />

      <PageHead
        title="Stack"
        figures={
          <>
            <span>{count} of them</span>
            <span>{skills.length} groups</span>
            <span>measured, not rated</span>
          </>
        }
        lede="What I would put my name to. The bars are real: they are the share of my editor time over the last thirty days, read from a Wakapi on my own box, and most rows do not have one because most work is not a language a plugin can see."
      />

      <StackBoard linkable={linkable} />

      <Footer />
    </main>
  );
}
