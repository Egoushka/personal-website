import Link from "next/link";
import Search from "@/components/Search";

/**
 * Wordmark left, search right, hairline underneath. That is the whole header.
 *
 * There is no primary navigation anywhere on this site. The trial balance is the
 * index: every page is reached by opening the claim it is evidence for, and a
 * `blog · about · projects · résumé` row above it would be a second, shorter
 * index that says nothing about why any of those pages exist. The wordmark goes
 * back to the balance; the footer carries the handful of destinations that are
 * not evidence for anything.
 *
 * Search is a magnifier that opens a modal, not a destination — it belongs on
 * every page, and a link to a search *page* is a worse version of that. The
 * /search/ route still exists as a no-JS fallback and is linked from the footer.
 *
 * On the balance itself the wordmark is a <span>, not a link to itself.
 */
export default function Nav(
  {
    /** Only "home" changes anything: it turns the wordmark into a <span>. The
     *  other values are kept so callers read as self-documenting. */
    current,
  }: { current?: "home" | "blog" | "about" | "projects" | "resume" | "search" } = {},
) {
  return (
    <header className="site-header bleed" data-pagefind-ignore>
      {current === "home" ? (
        <span className="brand">hrabovskyi.online</span>
      ) : (
        <Link className="brand" href="/">hrabovskyi.online</Link>
      )}

      {/*
        Search sits outside any <nav>. Two reasons, both real: the dialog's result
        links would land inside a navigation landmark, and `.site-header nav a` is
        inline-flex, which every hit row inherited.
      */}
      <div className="site-header-end">
        <Search />
      </div>
    </header>
  );
}
