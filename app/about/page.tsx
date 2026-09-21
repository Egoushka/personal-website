import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import Picture, { hasPicture } from "@/components/Picture";
import UsesStatus from "@/components/UsesStatus";
import TopicMap from "@/components/TopicMap";
import { site, feedTypes, experience, now, uses, usesUpdated } from "@/lib/site";
import { getReadings, getTopicUsage } from "@/lib/readings";

const description =
  "Backend-leaning full-stack developer in Ukraine. C# / .NET and ASP.NET Core, Angular when the work reaches the front end, and a homelab run like production.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about/", types: feedTypes },
  openGraph: {
    type: "profile",
    title: `About — ${site.name}`,
    description,
    url: `${site.url}/about/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `About — ${site.name}`, description },
};

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
    <main id="main" className="wrap">
      <Nav current="about" />

      <div className="rail rail--against-body">
        <span>{site.location}</span>
        <span>writing code since 2021</span>
        <a href={`mailto:${site.email}`}>email</a>
        <a href={site.github} rel="noopener">github</a>
        <a href={site.linkedin} rel="noopener">linkedin</a>
        <span className="rail--group rail--label">Also</span>
        <Link href="/cv/">the CV →</Link>
        <Link href="/links/">everywhere else →</Link>
      </div>

      <PageHead
        title="About"
        lede="The short version, the current version, and the whole stack it all runs on."
      />

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
          I&apos;m a backend-leaning full-stack developer based in Ukraine.
          {current && ` Right now I'm a ${current.role.split(" · ")[0]} at ${current.company}, `}
          working on backend services for a white-label crypto trading platform.
        </p>

        <p>
          Day to day that means <strong>C# / .NET and ASP.NET Core</strong>, with
          Angular and TypeScript when the work reaches the front end. The parts I
          actually care about are the ones that don&apos;t show up in a demo:
          error handling, observability, predictable behaviour under load, and
          code the next person can read without booking a meeting about it.
        </p>

        <h2>The homelab</h2>
        <p>
          Outside work I run a small homelab on a single VPS. It&apos;s a
          deliberate way to learn infrastructure properly: networking, secrets
          management, reverse proxies, and the difference between &quot;it
          works&quot; and &quot;it works at 3am.&quot; It&apos;s the cheapest
          environment I know for breaking production when production is only
          mine — and I write about it over in{" "}
          <Link href="/writing/">the writing</Link>.
        </p>
      </div>

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">Right now</span>
          <span>edited {r.nowUpdated}</span>
          <span>{r.daysSinceNow} days ago</span>
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

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">The stack</span>
          <span>verified {usesUpdated}</span>
          {/* Adds live state when /status.json is fresh; renders nothing otherwise. */}
          <UsesStatus />
        </span>
        <div>
          <div className="section-head">
            <h2>Everything I actually use</h2>
          </div>
        </div>
      </section>

      {/*
        The graph, the filter and the list share one filter query, so they live in
        one client component. `uses` is plain serialisable data from lib/site.ts —
        it passes through, it is not fetched.
      */}
      <TopicMap groups={uses} linkable={getTopicUsage().map((t) => t.slug)} />

      <Footer />
    </main>
  );
}
