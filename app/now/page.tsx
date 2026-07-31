import type { Metadata } from "next";
import React from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EntryHead from "@/components/EntryHead";
import { site, feedTypes, now } from "@/lib/site";
import { getReadings } from "@/lib/ledger";

const description =
  "What I'm working on right now — a /now page in the nownownow.com sense.";

export const metadata: Metadata = {
  title: "Now",
  description,
  alternates: { canonical: "/now/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Now — ${site.name}`,
    description,
    url: `${site.url}/now/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Now — ${site.name}`, description },
};

/**
 * A hundred words that have to read as deliberate rather than unfinished.
 *
 * Two moves do it: every sentence gets its own rail label, so the page is five
 * annotated rows instead of one short paragraph and the rail is fully engaged;
 * and the sentences set one step above body. A short page at reading size looks
 * like a stub — the same words at --fs-h3 look like statements.
 */
export default function Now() {
  // Same reading the balance prints, from the same place, so the two cannot drift.
  const daysSinceEdit = getReadings().daysSinceNow;

  return (
    <main id="main" className="wrap">
      <Nav />

      <EntryHead
        title="Now"
        claim={{ href: "/#claim-now", label: "Claim 06 — says what he is doing now" }}
        figures={
          <>
            edited <time dateTime={now.updated}>{now.updated}</time> ·{" "}
            {daysSinceEdit} days ago · dropped rather than left standing at six months
          </>
        }
      />

      <hr className="bleed" />
      <div className="row now-list">
        {now.items.map((item) => (
          <React.Fragment key={item.label}>
            <span className="rail rail--label">{item.label}</span>
            <p className="now-item">{item.text}</p>
          </React.Fragment>
        ))}
      </div>

      <hr className="bleed" />
      <p className="now-note">
        A <a href="https://nownownow.com/about" rel="noopener">/now page</a>.
        What I&apos;d tell you if we ran into each other.
      </p>

      <Footer />
    </main>
  );
}
