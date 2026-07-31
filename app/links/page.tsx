import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import { site, feedTypes, links } from "@/lib/site";

const description = "Everywhere else I am — GitHub, LinkedIn, email, and the feed.";

export const metadata: Metadata = {
  title: "Links",
  description,
  alternates: { canonical: "/links/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Links — ${site.name}`,
    description,
    url: `${site.url}/links/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Links — ${site.name}`, description },
};

/**
 * Four rows, and four is the honest number.
 *
 * There is no Mastodon row, no Bluesky row and no Twitter row, because I do not
 * post to any of them. A link to a dormant profile with my name on it is worse
 * than no link: it sends someone somewhere I am not. Add a row when there is
 * something behind it — the data is in lib/site.ts.
 */
export default function Links() {
  return (
    <main id="main" className="wrap">
      <Nav />

      <PageHead
        title="Links"
        figures={<>{links.length} places · all of them live</>}
        lede="Everywhere else I actually am. If it isn't listed, I'm not there."
      />

      <ul className="link-list">
        {links.map((l) => (
          <li className="link-row" key={l.label}>
            <div>
              <a href={l.href} rel="noopener">{l.label}</a>
              <p className="link-note">{l.note}</p>
            </div>
            <span className="link-handle">{l.handle}</span>
          </li>
        ))}
      </ul>

      <Footer />
    </main>
  );
}
