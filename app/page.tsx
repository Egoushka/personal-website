import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import UsesStatus from "@/components/UsesStatus";
import { PersonAndSiteLd } from "@/components/JsonLd";
import { site, projects } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";
import { getLedger, getReadings } from "@/lib/ledger";

/**
 * The trial balance.
 *
 * There is no hero, no feed and nothing featured, because the page is not an
 * introduction — it is the site's index, kept by double entry. Every claim is a
 * row; opening a row shows how its figure was obtained and what the figure does
 * not cover; and the route to a post runs through the claim it is evidence for,
 * so nothing can be read without seeing the rate it was written at.
 *
 * The page's length is set by the number of claims, not the number of posts, so
 * it is full at two posts and the same shape at twenty. What publishing changes
 * is the balance column.
 *
 * Every disclosure is a native <details>. No JavaScript is involved and none is
 * loaded for it; keyboard and pointer are one interaction rather than two
 * implementations. Nothing animates — the only candidate was the disclosure
 * height, and nothing was being communicated by the movement.
 */
export default function Home() {
  const ledger = getLedger();
  const r = getReadings();
  const posts = getAllPosts();
  const openRows = ledger.filter((c) => c.unbalanced).length;

  /**
   * Sub-entries, keyed by claim id rather than position. A claim that leads
   * somewhere carries the route inside its own row; the site has no other
   * navigation, so a page missing from here is a page nobody reaches.
   */
  const subEntry: Record<string, React.ReactNode> = {
    writes: (
      <ol className="sub-entries">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/posts/${p.slug}/`}>{p.title}</Link>
            <span className="sub-figure">
              <time dateTime={p.date}>{p.date}</time>
              {` · ${p.wordCount.toLocaleString("en-US")} w · ${p.readingTime} min`}
            </span>
          </li>
        ))}
        <li className="sub-aside">
          <Link href="/blog/">every post, by date</Link>
          <span className="sub-figure">
            <a href="/feed.xml">rss</a>
          </span>
        </li>
      </ol>
    ),
    measures: (
      <p className="sub-link">
        <Link href="/projects/">Chronicle — measurements first, description second</Link>
      </p>
    ),
    instruments: (
      <p className="sub-link">
        <Link href="/projects/">Baseline — measurements first, description second</Link>
      </p>
    ),
    machine: (
      <p className="sub-link">
        <Link href="/uses/">The box, and everything defined in git</Link>
      </p>
    ),
    craft: (
      <p className="sub-link">
        <Link href="/now/">/now — where that sentence is kept</Link>
      </p>
    ),
    now: (
      <p className="sub-link">
        <Link href="/now/">/now</Link>
      </p>
    ),
    uses: (
      <p className="sub-link">
        <Link href="/uses/">/uses</Link>
      </p>
    ),
    finished: (
      <ol className="sub-entries">
        {projects.map((p) => (
          <li key={p.name}>
            <a href={p.href} rel="noopener">{p.name}</a>
            <span className="sub-figure">{p.meta}</span>
          </li>
        ))}
        <li className="sub-aside">
          <Link href="/about/">Who is keeping this ledger</Link>
        </li>
      </ol>
    ),
  };

  return (
    <main id="main" className="sheet">
      <Nav current="home" links={false} />
      <PersonAndSiteLd />

      <header className="sheet-head">
        <h1>{site.name} — trial balance</h1>
        <p className="sheet-drawn">
          drawn <time dateTime={r.drawnOn}>{r.drawnOn}</time>
          <span className="sep">·</span>Kyiv, UA
          <span className="sep">·</span>open to work
          <span className="sep">·</span>
          <Link href="/resume/">résumé, back room</Link>
        </p>
        <p className="sheet-lede">
          {ledger.length} claims this site makes about its owner, each set against
          what can be measured. {openRows} do not balance. They are left open.
        </p>
      </header>

      <ol className="ledger">
        {ledger.map((c, i) => (
          <li key={c.id} className={c.unbalanced ? "ledger-row is-open" : "ledger-row"}>
            <details>
              <summary>
                <span className="ledger-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ledger-claim">{c.claim}</span>
                <span className="ledger-evidence">
                  {c.evidence}
                  {c.id === "machine" && <UsesStatus compact />}
                </span>
                <span className="ledger-balance">{c.balance}</span>
              </summary>
              <div className="ledger-detail">
                <p>{c.detail}</p>
                {subEntry[c.id]}
              </div>
            </details>
          </li>
        ))}
      </ol>

      <p className="sheet-note">
        No figure appears on this page unless a claim depends on it. Commit counts
        and lines-per-file are omitted for that reason. Every row opens.
      </p>

      <Footer />
    </main>
  );
}
