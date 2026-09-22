import type { Metadata } from "next";
import Link from "next/link";
import StackOrbit from "@/components/StackOrbit";
import { skills, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Design preview",
  description: "A prototype: colder and tighter, but with the instrument panel showing.",
  robots: { index: false, follow: false },
};

/**
 * Prototype, take two.
 *
 * Take one was correct and boring — which is what happens when you copy the
 * restraint of a product site. Linear is restrained because it is selling
 * software to a committee; there is exactly one thing it must not do, and that
 * is have a personality. A personal site has the opposite problem.
 *
 * So this keeps the cold ground and the tight type, and puts the thing nobody
 * else can copy in front: the instrumentation. Every number here is real and
 * already collected somewhere in his own stack — Wakapi on the box, the
 * container count from cron, Last.fm, NuGet. Hover any of them and it tells you
 * where it came from, which turns the site's one rule ("counted, not typed")
 * from a footnote into the interaction.
 */

/** A figure that admits where it came from. The site's rule, made tactile. */
function Fig({ value, unit, label, source }: { value: string; unit?: string; label: string; source: string }) {
  return (
    <span className="fig" tabIndex={0}>
      <span className="fig-value">{value}{unit && <em>{unit}</em>}</span>
      <span className="fig-label">{label}</span>
      <span className="fig-source">{source}</span>
    </span>
  );
}

export default function DesignPreview() {
  return (
    <main id="main" className="proto">
      <div className="proto-grain" aria-hidden="true" />
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
          <p className="proto-eyebrow"><span className="proto-dot" />Kyiv, Ukraine — available for contract work</p>
          <h1>I write .NET backends and fix the ones that <em>fail quietly</em>.</h1>
          <p className="proto-lede">
            The integration that reports success. The job that stopped running.
            The deploy that shipped nothing for fifty-one days — mine, found by
            accident.
          </p>
          <div className="proto-cta">
            <a className="proto-btn" href={`mailto:${site.email}`}>Email me</a>
            <a className="proto-btn proto-btn--ghost" href="#">Read the writing</a>
          </div>
        </section>

        {/* The instrument panel. This is the personality: a person who
            measures himself and publishes the result, including the bad parts. */}
        <section className="proto-panel">
          <div className="proto-panel-head">
            <span className="proto-kicker">Right now</span>
            <span className="proto-kicker proto-panel-note">everything below is read from my own box, tonight</span>
          </div>
          <div className="proto-figs">
            <Fig value="94" label="containers" source="docker ps on one Hetzner box, via cron" />
            <Fig value="37" unit="d" label="uptime" source="the same box, since the last kernel" />
            <Fig value="24" unit="h" label="coded, 30 days" source="Wakapi I host myself" />
            <Fig value="56" unit="%" label="of that was C#" source="Wakapi, per-language share" />
            <Fig value="408" label="NuGet installs" source="nuget.org counts these, not me" />
            <Fig value="987" unit="m" label="of music, this week" source="Last.fm — mostly Massive Attack" />
          </div>
        </section>

        <section className="proto-split">
          <article className="proto-card proto-card--wide">
            <span className="proto-kicker">The one anyone can install</span>
            <h3>Attest</h3>
            <p>
              Validates national ID, tax ID, VAT and postal codes for 87
              countries. A fork of a library that had been abandoned, with 197
              of its defects fixed, because work needed it.
            </p>
            <div className="proto-card-links">
              <a href="https://github.com/Egoushka/attest">the repo</a>
              <a href="https://www.nuget.org/packages/Attest">on NuGet</a>
            </div>
          </article>

          <article className="proto-card proto-card--broke">
            <span className="proto-kicker">What broke</span>
            <ul className="proto-broke">
              <li><span>51 days</span> a deploy reported success and shipped nothing</li>
              <li><span>2 days</span> a cache that would not clear — no consumer registered</li>
              <li><span>2 of 2</span> trading hypotheses, dead on the evidence</li>
            </ul>
            <p className="proto-broke-note">
              The failures are the part worth reading. They are also the only
              part most sites leave out.
            </p>
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
            <span className="proto-kicker">only what I would present</span>
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
          <span>hrabovskyi.online — one box in Nuremberg, everything in git</span>
          <Link href="/">back to the live site</Link>
        </footer>
      </div>
    </main>
  );
}
