import type { Metadata } from "next";
import React from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import UsesStatus from "@/components/UsesStatus";
import { site, feedTypes, uses, usesUpdated } from "@/lib/site";

const description =
  "The hardware, services and tools I actually use — a single Hetzner VPS run like production, plus the day-to-day .NET kit.";

export const metadata: Metadata = {
  title: "Uses",
  description,
  alternates: { canonical: "/uses/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Uses — ${site.name}`,
    description,
    url: `${site.url}/uses/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Uses — ${site.name}`, description },
};

/**
 * Name and description as a run-in definition list, not a card grid.
 *
 * Each name starts at the measure's left edge in a heavier weight and a lighter
 * colour, which is enough to scan — no container needed. A two-column `dl`
 * inside the measure was the obvious alternative and is wrong: a name column
 * plants a second vertical rule inside the prose, a few tens of pixels from the
 * real rail's gutter. Two margins at two scales. One rail per page.
 */
export default function Uses() {
  const total = uses.reduce((n, g) => n + g.items.length, 0);

  return (
    <main id="main" className="wrap">
      <Nav />

      <div className="rail hero-rail">
        <span>updated {usesUpdated}</span>
        <span>{total} things</span>
        {/* Adds live state when /status.json is fresh; renders nothing otherwise. */}
        <UsesStatus />
      </div>
      <div className="hero">
        <h1>Uses</h1>
        <p>
          What actually runs my work and my lab. Not aspirational — this is the
          current state, and the server half of it is version-controlled.
        </p>
      </div>

      {uses.map((group) => (
        <React.Fragment key={group.group}>
          <hr className="bleed" />
          <section className="row uses-group">
            <h2 className="rail rail--label" id={group.group.toLowerCase().replace(/\W+/g, "-")}>
              {group.group}
              <span className="rail-count">{group.items.length}</span>
            </h2>
            <dl className="uses-list">
              {group.items.map((item) => (
                <div className="uses-item" key={item.name}>
                  <dt>{item.name}</dt>
                  <dd>{item.desc}</dd>
                </div>
              ))}
            </dl>
          </section>
        </React.Fragment>
      ))}

      <Footer />
    </main>
  );
}
