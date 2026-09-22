import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import StackOrbit from "@/components/StackOrbit";
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
            <span>hover them</span>
          </>
        }
        lede="Everything I would put my name to, grouped by what it is for. Laid out rather than simulated: the arrangement is the same every time you open it."
      />

      <StackOrbit />

      {/*
        The text equivalent, and the real content. The figure above is a way of
        looking at this list; the list is what survives with no JavaScript, no
        pointer and a screen reader.
      */}
      <div className="stack-list">
        {skills.map((group) => (
          <section className="row" key={group.group}>
            <span className="rail rail--label">{group.group}</span>
            <dl className="uses-list">
              {group.items.map((skill) => (
                <div className="uses-item" key={skill.name}>
                  <dt>{skill.name}</dt>
                  <dd>{skill.now}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <Footer />
    </main>
  );
}
