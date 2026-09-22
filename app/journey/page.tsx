import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import Journey from "@/components/Journey";
import { site, feedTypes } from "@/lib/site";

const description =
  "Five years on a time axis: every paid role, what it was built with, and the months in between with no employer at all.";

export const metadata: Metadata = {
  title: "Journey",
  description,
  alternates: { canonical: "/journey/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Journey — ${site.name}`,
    description,
    url: `${site.url}/journey/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Journey — ${site.name}`, description },
};

/**
 * /journey/ — the record as a shape.
 *
 * The CV tells this as chapters and the stack tells it as a readout; this
 * tells it as a length of time, which is the only telling where the gaps are
 * visible. Each bar links back to the chapter it belongs to, so the page is a
 * way into the CV rather than a second copy of it.
 */
export default function JourneyPage() {
  // The axis ends today. The build clock is the only clock this site has.
  const now = new Date();
  const nowYear = now.getFullYear() + now.getMonth() / 12;

  return (
    <main id="main" className="wrap">
      <Nav />

      <PageHead
        title="Journey"
        figures={
          <>
            <span>2021 — now</span>
            <span>six roles</span>
            <span>gaps included</span>
          </>
        }
        lede="Not the stack — how it was acquired. Every bar is a date from the record, every tag a technology that role actually used, and the shaded stretches are the months with no employer."
      />

      <Journey nowYear={nowYear} />

      <p className="page-figures">
        <span>The same record, told as chapters, is on <Link href="/cv/">the CV</Link>.</span>
      </p>

      <Footer />
    </main>
  );
}
