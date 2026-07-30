import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import UsesStatus from "@/components/UsesStatus";
import SkillMap from "@/components/SkillMap";
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

      <hr className="bleed" />
      {/*
        The graph, the filter and the list share one filter query, so they live in
        one client component. `uses` is plain serialisable data from lib/site.ts —
        this passes through, it is not fetched.
      */}
      <SkillMap groups={uses} />

      <Footer />
    </main>
  );
}
