import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site, feedTypes, now } from "@/lib/site";

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

export default function Now() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="page-head" aria-labelledby="now-heading">
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> cat now.md</div>
            <h1 id="now-heading">Now</h1>
            <p className="section-intro">
              What has my attention at the moment. A{" "}
              <a href="https://nownownow.com/about" rel="noopener">/now page</a>.
            </p>

            <ul className="now-list">
              {now.items.map((item) => <li key={item}>{item}</li>)}
            </ul>

            <p className="now-updated">
              Last updated <time dateTime={now.updated}>{now.updated}</time>. If this is
              badly out of date, that is itself information — start at the{" "}
              <Link href="/blog/">blog</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
