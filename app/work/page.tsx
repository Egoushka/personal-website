import React from "react";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import { site, feedTypes, work } from "@/lib/site";

const description =
  "Contract .NET work: a one-week paid audit at $1,500–2,500, then either you fix it or I do. What I take on, what it costs, and what I will not take.";

export const metadata: Metadata = {
  title: "Work",
  description,
  alternates: { canonical: "/work/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Work — ${site.name}`,
    description,
    url: `${site.url}/work/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Work — ${site.name}`, description },
};

/**
 * /work — the page the home page's one call to action points at.
 *
 * It exists because the rest of this site answers "who is this" and none of it
 * answered "what would I hire him for, and what would it cost". A reader who
 * has to write and ask the price has already decided not to.
 *
 * Structure, not decoration: every section is the same `.row` the rest of the
 * site uses, with the terms in the rail. Nothing here is a card, a badge or a
 * pricing table, because this site does not have those and a page that invents
 * three new components to sell something is selling the components.
 */
export default function Work() {
  return (
    <main id="main" className="wrap">
      <Nav current="work" />

      <PageHead title="Work" lede={work.lede} />

      {work.sections.map((s) => (
        <React.Fragment key={s.heading}>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--against-body">
              <span className="rail--label">{s.rail}</span>
              {s.meta?.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </span>
            <div className="work-body">
              <div className="section-head">
                <h2>{s.heading}</h2>
              </div>
              {s.body?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.items && (
                <ul>
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </React.Fragment>
      ))}

      <p className="work-cta">
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>

      <Footer />
    </main>
  );
}
