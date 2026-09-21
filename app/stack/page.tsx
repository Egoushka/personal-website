import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import StackPlayground from "@/components/StackPlayground";
import { site, feedTypes, skills } from "@/lib/site";

const description =
  "Every skill I would put my name to, as a graph you can pull apart: what I use, what it connects to, and where each one actually stands.";

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
 * /stack/ — the graph, at the size it earns.
 *
 * It used to be a figure on /about/, in a box small enough that the labels
 * fought each other. It is the most distinctive thing on this site and it was
 * being shown in a postage stamp.
 *
 * The figures are counted, as everywhere else: the number of skills and the
 * number of groups come from the list itself, so this line cannot drift from
 * the thing underneath it.
 */
export default function Stack() {
  const count = skills.reduce((n, g) => n + g.items.length, 0);

  return (
    <main id="main" className="wrap stack-page">
      <Nav current="stack" />

      <PageHead
        title="Stack"
        figures={
          <>
            <span>{count} skills</span>
            <span>{skills.length} groups</span>
            <span>drag them</span>
          </>
        }
        lede="Everything I would put my name to, and what each one connects to. The lines are not decoration: an edge is only here if it says something true about how the two things are used together."
      />

      <StackPlayground />

      <Footer />
    </main>
  );
}
