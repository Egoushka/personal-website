import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import Picture, { hasPicture } from "@/components/Picture";
import UsesStatus from "@/components/UsesStatus";
import { site, experience, now, links, usesUpdated } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/posts";

const description =
  "Backend-leaning full-stack developer in Ukraine. C# / .NET and ASP.NET Core, Angular when the work reaches the front end, and a homelab run like production.";

export const metadata: Metadata = pageMetadata({ title: "About", description, path: "/about/", type: "profile" });

/**
 * Who I am, what has my attention, what I run, and how to reach me.
 *
 * The contact block is last because that is where a reader who got this far
 * decides to write. It is built only from facts in lib/site.ts — no terms,
 * rates or capacity are ever inferred; `site.engagement` prints only when I
 * have written one.
 */
export default function About() {
  const current = experience.find((j) => j.end === null);
  const email = links.find((l) => l.href === `mailto:${site.email}`);
  const elsewhere = links.filter((l) => l !== email);

  return (
    <Shell current="about">

      <section className="row about-intro" data-pagefind-body>
        <div className="rail rail--against-body about-rail">
          <span>{site.location}</span>
          <span>writing code since 2021</span>
          <a href={`mailto:${site.email}`}>email</a>
          <a href={site.github} rel="noopener">github</a>
          <a href={site.linkedin} rel="noopener">linkedin</a>
          <span className="rail--group rail--label">Also</span>
          <Link href="/cv/">the CV</Link>
        </div>

        <div>
          <PageHead title="About" quiet />

          <div className="about-copy">
            {/* Appears as soon as assets/images/portrait.jpg exists — see
                assets/images/README.md. No code change needed to turn it on. */}
            {hasPicture("portrait") && (
              <Picture
                name="portrait"
                alt="Yehor Hrabovskyi"
                className="portrait"
                sizes="(max-width: 560px) 140px, 180px"
                priority
              />
            )}

            <p>
              Backend developer in Ukraine.
              {current && ` ${current.role} at ${current.company}, `}
              on a crypto trading platform: C# and ASP.NET Core, and the parts that
              never show up in a demo — error handling, observability, what happens
              under load.
            </p>

            <p>
              Outside work I run one VPS like a production environment, because it
              is the cheapest place I know to break things that are only mine. Most
              of <Link href="/writing/">the writing</Link> comes out of it.
            </p>
          </div>
        </div>
      </section>

      <hr className="bleed" />
      <section className="row" data-pagefind-body>
        <span className="rail rail--against-body">
          <span className="rail--label">Right now</span>
          <span>edited <time dateTime={now.updated}>{formatDate(now.updated)}</time></span>
        </span>
        <div className="section-head">
          <h2>What has my attention</h2>
        </div>
      </section>
      {/* A top-level `.row`, not nested inside the one above: a `.row` inside a
          `.row` gets its own full-width grid inside the measure column and the
          rail has nothing to align to. */}
      <div className="row now-list" data-pagefind-body>
        {now.items.map((item) => (
          <React.Fragment key={item.label}>
            <span className="rail rail--label">{item.label}</span>
            <p className="now-item">{item.text}</p>
          </React.Fragment>
        ))}
      </div>

      {/*
        The stack lives on /skills/, not here as well: a page about a person
        should say what he is like, and a page about the work should carry the
        tools.
      */}
      <hr className="bleed" />
      <section className="row" data-pagefind-body>
        <span className="rail rail--against-body">
          <span className="rail--label">The stack</span>
          <span>verified {usesUpdated}</span>
          <UsesStatus />
        </span>
        <div>
          <div className="section-head">
            <h2>What I actually run</h2>
            <Link href="/skills/">Skills</Link>
          </div>
          <p className="page-lede">
            One box, every service defined in git. The full list — what I use
            and what I would put my name to — is on{" "}
            <Link href="/skills/">the skills page</Link>.
          </p>
        </div>
      </section>

      <hr className="bleed" />
      <section className="row contact" id="contact" aria-labelledby="contact-title" data-pagefind-body>
        <span className="rail rail--against-body">
          <span className="rail--label">Contact</span>
          <span>{site.timezone}</span>
        </span>
        <div>
          <div className="section-head">
            <h2 id="contact-title">Working with me</h2>
          </div>
          <p className="contact-lede">
            {site.role}, in {site.location} ({site.timezone}), {site.availability}.
          </p>
          {site.engagement && <p className="contact-lede">{site.engagement}</p>}
          <p className="contact-email">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            {email && <span className="contact-note">{email.note}</span>}
          </p>
          <ul className="contact-links">
            {elsewhere.map((l) => (
              <li key={l.label}>
                <a href={l.href} rel={l.href.startsWith("/") ? undefined : "noopener"}>{l.label}</a>
                <span className="contact-note">{l.note}</span>
              </li>
            ))}
            <li>
              <Link href="/cv/">CV</Link>
              <span className="contact-note">The record, on one printable page.</span>
            </li>
          </ul>
        </div>
      </section>

    </Shell>
  );
}
