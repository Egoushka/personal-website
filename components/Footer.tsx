import Link from "next/link";
import { site } from "@/lib/site";

/**
 * The site map lives here, not in the header. Everything the nav dropped is
 * reachable from every page at every width — which is the trade that lets the
 * header stay at four items.
 */
export default function Footer() {
  // Static export: this is build time, so it only changes when the site rebuilds.
  const year = new Date().getFullYear();

  return (
    <footer data-pagefind-ignore>
      <div className="inner">
        <nav className="footer-cols" aria-label="Footer">
          <div>
            <h2>Writing</h2>
            <ul>
              <li><Link href="/blog/">All posts</Link></li>
              <li><Link href="/search/">Search</Link></li>
              <li><a href="/feed.xml">RSS</a></li>
            </ul>
          </div>
          <div>
            <h2>Site</h2>
            <ul>
              <li><Link href="/about/">About</Link></li>
              <li><Link href="/resume/">Résumé</Link></li>
              <li><Link href="/uses/">Uses</Link></li>
              <li><Link href="/now/">Now</Link></li>
            </ul>
          </div>
          <div>
            <h2>Elsewhere</h2>
            <ul>
              <li><a href={site.github} rel="noopener">GitHub</a></li>
              <li><a href={site.linkedin} rel="noopener">LinkedIn</a></li>
              <li><a href={`mailto:${site.email}`}>Email</a></li>
            </ul>
          </div>
        </nav>

        <div className="note">© {year} {site.name} · built &amp; self-hosted</div>
      </div>
    </footer>
  );
}
