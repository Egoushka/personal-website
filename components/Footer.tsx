import Link from "next/link";
import { site } from "@/lib/site";

/**
 * One line, left-aligned to the rail's left edge — not centred, not a
 * three-column site map. The header carries the four real destinations, so the
 * footer carries the things that are not sections: the feed, the source, and the
 * page listing everywhere else I am.
 */
export default function Footer() {
  return (
    <footer className="site-footer bleed" data-pagefind-ignore>
      {site.domain}
      <span className="sep">·</span>
      <Link href="/links/">links</Link>
      <span className="sep">·</span>
      <a href="/feed.xml">rss</a>
      <span className="sep">·</span>
      <a href={site.github} rel="noopener">source</a>
    </footer>
  );
}
