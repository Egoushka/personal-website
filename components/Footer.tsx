import Link from "next/link";
import { site } from "@/lib/site";

/**
 * One mono line, left-aligned to the rail's left edge — not centred, not a
 * three-column site map. The header carries every destination now, so the
 * footer's old job is gone.
 */
export default function Footer() {
  return (
    <footer className="site-footer bleed" data-pagefind-ignore>
      {site.domain}
      <span className="sep">·</span>
      {/*
        /uses/ and /now/ live here rather than in the nav. Nav is a promise of
        maintenance: a `now` in the top nav that was last touched eleven months
        ago is worse than no /now/ page at all. If this one passes six months
        without an edit, drop the link rather than leave it — a missing /now/ is
        neutral, a stale one is a statement.
      */}
      <Link href="/uses/">uses</Link>
      <span className="sep">·</span>
      <Link href="/now/">now</Link>
      <span className="sep">·</span>
      <a href="/feed.xml">rss</a>
      <span className="sep">·</span>
      <a href={site.github} rel="noopener">source</a>
    </footer>
  );
}
