import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { ProfilePageLd } from "@/components/JsonLd";
import PrintCv from "@/components/PrintCv";
import React from "react";
import { site, experience, education, projects, skills, eras } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { formatSpan } from "@/lib/dates";
import { getTopicUsage } from "@/lib/readings";
import Measured from "@/components/Measured";

const description =
  "CV of Yehor Hrabovskyi — .NET backend engineer. Clean Architecture, CQRS, ASP.NET Core, Angular, self-hosted infrastructure.";

export const metadata: Metadata = pageMetadata({ title: "CV", description, path: "/cv/", type: "profile" });

export default function CV() {
  // Only link a skill whose hub actually exists — the vocabulary is wider than
  // the pages it has earned, and a static file server cannot redirect its way
  // out of a dangling link.
  const hasPage = new Set(getTopicUsage().map((t) => t.slug));

  /** A section of the sheet: its label in a column of its own on a wide screen, a band on paper. */
  const SECTION = "cv-section grid gap-4 border-b py-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12";

  return (
    <Shell current="cv" className="cv">
      <ProfilePageLd />

      {/* Search indexes the record and nothing around it: the masthead and
          each section below carry data-pagefind-body. */}
      <header className="masthead border-b pt-10 pb-8 md:pt-14" data-pagefind-body>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{site.name}</h1>
        <p className="role-title mt-2 text-lg text-muted-foreground">{site.role}</p>
        <div className="masthead-rail mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="link" href={site.url}>{site.domain}</a>
          <a className="link" href={site.github} rel="noopener">github.com/{site.githubHandle}</a>
          <a className="link" href={site.linkedin} rel="noopener">linkedin.com/in/{site.linkedinHandle}</a>
          <span className="text-muted-foreground">{site.location}</span>
        </div>
        <PrintCv />
      </header>

      {/*
        The record, told as eras. Each era carries its own prose and one
        obstacle, and wraps the roles of that period. All of the prose is
        display:none in print: the sheet that comes out of Cmd+P is the ordinary
        reverse-chronological record, and the screen is the version that
        explains it. Bullets that survive to paper are chosen by `printBullets`
        on the data, never by position in the stylesheet.
      */}
      {eras.map((era) => (
        <section
          className={`${SECTION} cv-era${era.jobs.length === 0 ? " print-hide" : ""}`}
          id={era.slug}
          key={era.slug}
          data-pagefind-body
        >
          <div>
            {/* Paper gets one "Experience" band above the whole record; screen
                gets the era's years. */}
            <p className="cv-section-label print-only">Experience</p>
            <p className="cv-section-label screen-only lg:sticky lg:top-20">{era.years}</p>
          </div>
          <div className="min-w-0 max-w-3xl">
            <h2 className="era-title font-display text-3xl font-semibold tracking-tight">{era.title}</h2>
            {era.body.map((paragraph) => (
              <p className="era-prose mt-4 text-lg leading-relaxed text-foreground/90" key={paragraph.slice(0, 40)}>
                {paragraph}
              </p>
            ))}
            {era.obstacle && (
              <p className="era-obstacle">
                <span className="era-obstacle-label">What went wrong</span>
                {era.obstacle}
              </p>
            )}

            {experience
              .filter((job) => era.jobs.includes(job.company))
              .map((job) => (
                <div className={`job${job.resumeCompact ? " job--compact" : ""}`} key={job.company + job.start}>
                  <div className="job-head">
                    <h3 className="job-name">{job.company}</h3>
                    <span className="job-dates">{formatSpan(job, "numeric")}</span>
                  </div>
                  <p className="job-meta">
                    {[job.role, job.focus, job.location, job.mode].filter(Boolean).join(" · ")}
                  </p>
                  <ul>
                    {job.points.map((pt, j) => (
                      <li key={j} className={j >= (job.printBullets ?? 0) ? "print-hide" : undefined}>
                        {pt.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className={SECTION} data-pagefind-body>
        <h2 className="cv-section-label">Projects</h2>
        <div className="min-w-0 max-w-3xl">
          {projects.map((p) => (
            <div className={`job${p.print ? "" : " print-hide"}`} key={p.slug}>
              <div className="job-head">
                <h3 className="job-name">
                  {p.href ? <a className="link" href={p.href} rel="noopener">{p.name}</a> : p.name}
                </h3>
                <span className="job-dates">{p.lang}</span>
              </div>
              <p className="job-meta project-stack">{p.tech.slice(0, 6).join(" · ")}</p>
              {/* One line on paper. The full account is on the project's own
                  page; a CV bullet that runs four lines does not get read. */}
              <ul><li>{p.resumeLine ?? p.summary}</li></ul>
            </div>
          ))}
        </div>
      </section>

      {/*
        Skills, curated and grouped, each saying where it actually stands: the
        honesty is in the second line, which has to be specific enough to be
        wrong. `Measured` prints the share of my editor time from my own Wakapi,
        and renders nothing when the box is not publishing. On paper the second
        lines are hidden and this compresses back to names.
      */}
      <section className={SECTION} data-pagefind-body>
        <h2 className="cv-section-label">
          <Link className="hover:text-foreground" prefetch={false} href="/skills/">Skills</Link>
        </h2>
        <div className="skill-groups grid gap-8 sm:grid-cols-2">
          {skills.map((group) => (
            <div className="skill-group" key={group.group}>
              <h3 className="text-sm font-semibold">{group.group}</h3>
              <dl className="mt-3 space-y-3">
                {group.items.map((skill) => (
                  <React.Fragment key={skill.name}>
                    <dt className="font-medium">
                      {skill.topic && hasPage.has(skill.topic)
                        ? <Link className="link" prefetch={false} href={`/topics/${skill.topic}/`}>{skill.name}</Link>
                        : skill.name}
                      {skill.wakatime && <Measured lang={skill.wakatime} />}
                    </dt>
                    <dd className="-mt-2 text-sm leading-relaxed text-muted-foreground">{skill.now}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION} data-pagefind-body>
        <h2 className="cv-section-label">Education</h2>
        <div className="min-w-0 max-w-3xl">
          {education.map((e) => (
            <div className="job edu" key={e.school}>
              <div className="job-head">
                <h3 className="job-name">{e.school}</h3>
                <span className="job-dates">{e.when}</span>
              </div>
              <p className="job-meta">{[e.degree, e.detail].filter(Boolean).join(" · ")}</p>
              <ul className="print-hide"><li>{e.note}</li></ul>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
