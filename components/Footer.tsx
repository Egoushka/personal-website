import Link from "next/link";
import { site } from "@/lib/site";

/**
 * One line, left-aligned to the rail's left edge — not centred, not a
 * three-column site map. The header carries the real destinations, so the footer
 * carries the things that are not sections: the journey, how to reach me, the
 * feed and the source.
 *
 * /journey/ is here because nothing else links to it, and a finished page
 * nobody can navigate to is the same as a missing one.
 */
export default function Footer() {
  return (
    <footer className="site-footer bleed" data-pagefind-ignore>
      <span>{site.domain}</span>
      <span><Link href="/journey/">journey</Link></span>
      <span><Link href="/about/#contact">contact</Link></span>
      <span><a href="/feed.xml">rss</a></span>
      <span><a href={site.github} rel="noopener">github</a></span>
    </footer>
  );
}
