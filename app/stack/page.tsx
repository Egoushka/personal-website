import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import StackOrbit from "@/components/StackOrbit";
import Link from "next/link";
import Measured from "@/components/Measured";
import { site, feedTypes, skills, uses, usesUpdated } from "@/lib/site";
import { getTopicUsage } from "@/lib/readings";

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
  // Only link a skill whose hub exists — the vocabulary is wider than the
  // pages it has earned, and a static file server cannot redirect its way out
  // of a dangling link.
  const hasPage = new Set(getTopicUsage().map((t) => t.slug));

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
        The list is the content; the figure above is one way of looking at it.
        This is what survives with no JavaScript, no pointer and a screen
        reader, so it is laid out to be read rather than to be a fallback.

        A skill that has a hub links to it. A skill my Wakapi measures prints
        the share beside the claim, and prints nothing when the box is quiet.
      */}
      <div className="stack-groups">
        {skills.map((group) => (
          <section className="stack-group" key={group.group}>
            <h2 className="rail--label">{group.group}</h2>
            <ul>
              {group.items.map((skill) => (
                <li key={skill.name}>
                  <span className="stack-name">
                    {skill.topic && hasPage.has(skill.topic)
                      ? <Link href={`/topics/${skill.topic}/`}>{skill.name}</Link>
                      : skill.name}
                    {skill.wakatime && <Measured lang={skill.wakatime} />}
                  </span>
                  <span className="stack-now">{skill.now}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/*
        What the skills list deliberately is not: the machines. These are the
        services running on one box right now, which is a different claim from
        "I would put my name to this" and belongs on the same page rather than
        on a second one that says the same thing in a different order.
      */}
      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">The box</span>
          <span>verified {usesUpdated}</span>
        </span>
        <div>
          <div className="section-head">
            <h2>What runs on it</h2>
          </div>
          <div className="stack-groups stack-groups--box">
            {uses.map((group) => (
              <section className="stack-group" key={group.group}>
                <h3 className="rail--label">{group.group}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <span className="stack-name">
                        {item.href
                          ? <a href={item.href} rel="noopener">{item.name}</a>
                          : item.name}
                      </span>
                      <span className="stack-now">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
