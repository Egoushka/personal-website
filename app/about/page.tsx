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
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0">
          <section data-pagefind-body>
            <PageHead title="About" />

            {/* Appears as soon as assets/images/portrait.jpg exists (see
                assets/images/README.md). No code change needed to turn it on. */}
            {hasPicture("portrait") && (
              <Picture
                name="portrait"
                alt="Yehor Hrabovskyi"
                className="mb-6 w-36 rounded-xl border sm:float-right sm:mb-4 sm:ml-8 sm:w-44"
                sizes="(max-width: 560px) 140px, 180px"
                priority
              />
            )}

            <div className="max-w-2xl space-y-5 text-lg leading-relaxed">
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
                of <Link className="link" prefetch={false} href="/writing/">the writing</Link> comes out of it.
              </p>
            </div>
          </section>

          <section className="mt-16 border-t pt-10" aria-labelledby="about-now" data-pagefind-body>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="about-now" className="text-2xl font-semibold tracking-tight">What has my attention</h2>
              <p className="text-sm text-muted-foreground">
                edited <time dateTime={now.updated}>{formatDate(now.updated)}</time>
              </p>
            </div>
            <dl className="mt-6 divide-y rounded-xl border">
              {now.items.map((item) => (
                <div key={item.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                  <dd className="leading-relaxed">{item.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/*
            The stack lives on /skills/, not here as well: a page about a person
            says what he is like, and a page about the work carries the tools.
          */}
          <section className="mt-16 border-t pt-10" aria-labelledby="about-stack" data-pagefind-body>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="about-stack" className="text-2xl font-semibold tracking-tight">What I actually run</h2>
              <p className="text-sm text-muted-foreground">verified {usesUpdated}</p>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              One box, every service defined in git. The full list — what I use and
              what I would put my name to — is on{" "}
              <Link className="link" prefetch={false} href="/skills/">the skills page</Link>.
            </p>
          </section>

          <section
            className="mt-16 border-t pt-10"
            id="contact"
            aria-labelledby="contact-title"
            data-pagefind-body
          >
            <h2 id="contact-title" className="text-2xl font-semibold tracking-tight">Working with me</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {site.role}, in {site.location} ({site.timezone}), {site.availability}.
            </p>
            {site.engagement && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">{site.engagement}</p>}
            <div className="mt-6 rounded-xl border bg-card p-5">
              <a className="link inline-flex min-h-6 items-center text-lg font-medium" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              {email && <p className="mt-1 text-sm text-muted-foreground">{email.note}</p>}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {elsewhere.map((l) => (
                <li key={l.label} className="group relative rounded-xl border p-4 transition-colors hover:border-input hover:bg-accent/40">
                  <a
                    href={l.href}
                    rel={l.href.startsWith("/") ? undefined : "noopener"}
                    className="font-medium after:absolute after:inset-0 after:rounded-xl"
                  >
                    {l.label}
                  </a>
                  <span className="ml-2 text-sm text-muted-foreground">{l.handle}</span>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{l.note}</p>
                </li>
              ))}
              <li className="group relative rounded-xl border p-4 transition-colors hover:border-input hover:bg-accent/40">
                <Link prefetch={false} href="/cv/" className="font-medium after:absolute after:inset-0 after:rounded-xl">
                  CV
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">The record, on one printable page.</p>
              </li>
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start lg:pt-14" aria-label="At a glance">
          <div className="rounded-xl border bg-card p-5">
            <p className="font-semibold">{site.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{site.role}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Based in</dt>
                <dd>{site.location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Time zone</dt>
                <dd>{site.timezone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Writing code</dt>
                <dd>since 2021</dd>
              </div>
            </dl>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-sm">
              <li><a className="link inline-flex min-h-6 items-center" href={`mailto:${site.email}`}>Email</a></li>
              <li><a className="link inline-flex min-h-6 items-center" href={site.github} rel="noopener">GitHub</a></li>
              <li><a className="link inline-flex min-h-6 items-center" href={site.linkedin} rel="noopener">LinkedIn</a></li>
              <li><Link className="link inline-flex min-h-6 items-center" prefetch={false} href="/cv/">CV</Link></li>
            </ul>
            <UsesStatus />
          </div>
        </aside>
      </div>
    </Shell>
  );
}
