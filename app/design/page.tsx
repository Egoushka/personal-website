import type { Metadata } from "next";
import Link from "next/link";
import StackOrbit from "@/components/StackOrbit";
import { skills, proof, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Design preview",
  description: "A prototype of a colder, tighter, sans-set version of this site.",
  robots: { index: false, follow: false },
};

/**
 * A throwaway page for judging a direction, not a page of the site.
 *
 * It is `noindex`, it is not in the nav or the sitemap, and everything it uses
 * is namespaced under `.proto` in globals.css so none of it can leak into the
 * live pages before it has been chosen. If the direction is taken, the tokens
 * move into `:root` and this route is deleted.
 */
export default function DesignPreview() {
  return (
    <main id="main" className="proto">
      <div className="proto-shell">
        <header className="proto-nav">
          <span className="proto-brand">Yehor Hrabovskyi</span>
          <nav>
            <a href="#">Writing</a>
            <a href="#">Projects</a>
            <a href="#">Stack</a>
            <a href="#">About</a>
          </nav>
        </header>

        <section className="proto-hero">
          <h1>I write .NET backends and fix the ones that fail quietly.</h1>
          <p className="proto-lede">
            Kyiv, Ukraine. Available for contract work.
          </p>
          <div className="proto-cta">
            <a className="proto-btn" href={`mailto:${site.email}`}>Email me</a>
            <a className="proto-btn proto-btn--ghost" href="#">Read the writing</a>
          </div>
        </section>

        <section className="proto-cards">
          {proof.map((p) => (
            <article className="proto-card" key={p.label}>
              <span className="proto-kicker">{p.label}</span>
              <p>{p.text}</p>
              {p.links.length > 0 && (
                <div className="proto-card-links">
                  {p.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
                </div>
              )}
            </article>
          ))}
          <article className="proto-card proto-card--figure">
            <span className="proto-kicker">Measured</span>
            <p className="proto-figure">56<span>%</span></p>
            <p className="proto-figure-note">of my editor time this month was C#, from a Wakapi I host myself.</p>
          </article>
        </section>

        <section className="proto-section">
          <div className="proto-section-head">
            <h2>Stack</h2>
            <span className="proto-kicker">23 skills · laid out, not simulated</span>
          </div>
          <StackOrbit />
        </section>

        <section className="proto-section">
          <div className="proto-section-head">
            <h2>Skills</h2>
          </div>
          <div className="proto-skills">
            {skills.map((g) => (
              <div className="proto-skill-group" key={g.group}>
                <span className="proto-kicker">{g.group}</span>
                <ul>
                  {g.items.map((s) => (
                    <li key={s.name}><span>{s.name}</span><em>{s.now}</em></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="proto-foot">
          <span>hrabovskyi.online</span>
          <Link href="/">back to the live site</Link>
        </footer>
      </div>
    </main>
  );
}
