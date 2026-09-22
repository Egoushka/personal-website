import Link from "next/link";
import { site } from "@/lib/site";

/**
 * One line, left-aligned to the rail's left edge — not centred, not a
 * three-column site map. The header carries the real destinations, so the footer
 * carries the things that are not sections: the CV, the journey, the feed, the
 * source, and the page listing everywhere else I am.
 *
 * /journey/ is here because it was reachable from nothing — in the sitemap, so
 * search engines indexed it, but with no path in from the site itself. A
 * finished page nobody can navigate to is the same as a missing one.
 *
 * The CV lives here rather than in the hero on purpose. A CV answers "should we
 * hire him", and nobody arriving at this site is asking that any more; it stays
 * because the record should be one click away, not because it is the pitch.
 */
export default function Footer() {
  return (
    <footer className="site-footer bleed" data-pagefind-ignore>
      <span>{site.domain}</span>
      <span><Link href="/cv/">cv</Link></span>
      <span><Link href="/journey/">journey</Link></span>
      <span><Link href="/links/">links</Link></span>
      <span><a href="/feed.xml">rss</a></span>
      <span><a href={site.github} rel="noopener">github</a></span>
    </footer>
  );
}
