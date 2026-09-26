import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import Picture, { hasPicture } from "@/components/Picture";
import UsesStatus from "@/components/UsesStatus";
import { site, experience, now, uses, usesUpdated } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { getReadings } from "@/lib/readings";

const description =
  "Backend-leaning full-stack developer in Ukraine. C# / .NET and ASP.NET Core, Angular when the work reaches the front end, and a homelab run like production.";

export const metadata: Metadata = pageMetadata({ title: "About", description, path: "/about/", type: "profile" });

/**
 * About, and everything that used to be scattered across /now/ and /uses/.
 *
 * Those were two routes whose entire job was to prove they were fresh — /now/
 * carried a rule that deleted its own link at six months, /uses/ printed an
 * expiry date. Both are sections of this page now. A short list on a page
 * someone is already reading beats a route that has to justify its own
 * freshness, and neither one ever had enough on it to be a destination.
 */
export default function About() {
  const current = experience.find((j) => j.when.includes("present"));
  const r = getReadings();

  return (
    <Shell current="about">

      <div className="rail rail--against-body">
        <span>{site.location}</span>
        <span>writing code since 2021</span>
        <a href={`mailto:${site.email}`}>email</a>
        <a href={site.github} rel="noopener">github</a>
        <a href={site.linkedin} rel="noopener">linkedin</a>
        <span className="rail--group rail--label">Also</span>
        <Link href="/cv/">the CV</Link>
        <Link href="/links/">everywhere else</Link>
      </div>

      <PageHead title="About" quiet />

      <div className="prose">
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

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">Right now</span>
          <span>edited {r.nowUpdated}</span>
          <span>{r.daysSinceNow} {r.daysSinceNow === 1 ? "day" : "days"} ago</span>
        </span>
        <div className="section-head">
          <h2>What has my attention</h2>
        </div>
      </section>
      {/* A top-level `.row`, not nested inside the one above: a `.row` inside a
          `.row` gets its own full-width grid inside the measure column and the
          rail has nothing to align to. */}
      <div className="row now-list">
        {now.items.map((item) => (
          <React.Fragment key={item.label}>
            <span className="rail rail--label">{item.label}</span>
            <p className="now-item">{item.text}</p>
          </React.Fragment>
        ))}
      </div>

      {/*
        The stack used to be listed here in full, and again on /skills/ — the
        same twenty-odd rows, twice, with the second copy carrying a graph. One
        of them had to go, and it was this one: a page about a person should
        say what he is like, and a page about the work should carry the tools.
      */}
      <hr className="bleed" />
      <section className="row">
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

    </Shell>
  );
}
