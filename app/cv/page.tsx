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

  return (
    <Shell current="cv" className="cv">
      <ProfilePageLd />

      <div className="rail masthead-rail">
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={site.url}>{site.domain}</a>
        <a href={site.github} rel="noopener">github.com/{site.githubHandle}</a>
        <a href={site.linkedin} rel="noopener">linkedin.com/in/{site.linkedinHandle}</a>
        <span>{site.location}</span>
      </div>
      {/* Search indexes the record and nothing around it: the masthead and
          each section below carry data-pagefind-body. */}
      <div className="masthead" data-pagefind-body>
        <h1>{site.name}</h1>
        <p className="role-title">{site.role}</p>
      </div>

      <PrintCv />

      {/*
        The record, told as eras.

        Each era carries its own prose and one obstacle, and wraps the roles of
        that period. **All of the prose is display:none in print** — the sheet
        that comes out of Cmd+P is the ordinary reverse-chronological record a
        reader expects, and the screen is the version that explains it.

        Bullets that survive to paper are chosen by `printBullets` on the data,
        not by `:nth-child` in the stylesheet: the markup is nested inside eras
        now, and a positional rule would have kept working while quietly
        counting the wrong thing.
      */}
      {eras.map((era) => (
        <React.Fragment key={era.slug}>
          <hr className="bleed" />
          <section
            className={`row section cv-era${era.jobs.length === 0 ? " print-hide" : ""}`}
            id={era.slug}
            data-pagefind-body
          >
            <div className="rail">
              {/* Paper gets one "Experience" label above the whole record;
                  screen gets the era's years. Both live in the same rail, and
                  the print sheet swaps which one is visible. */}
              <span className="rail--label print-only">Experience</span>
              <span className="rail--label screen-only">{era.years}</span>
            </div>
            <div>
              <h2 className="era-title">{era.title}</h2>
              {era.body.map((paragraph) => (
                <p className="era-prose" key={paragraph.slice(0, 40)}>{paragraph}</p>
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
                    <p className="job-meta run">
                      <span>{job.role}</span>
                      {job.focus && <span>{job.focus}</span>}
                      {job.location && <span>{job.location}</span>}
                      {job.mode && <span>{job.mode}</span>}
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
        </React.Fragment>
      ))}

      <hr className="bleed" />
      <section className="row section" data-pagefind-body>
        <h2 className="rail rail--label">Projects</h2>
        <div>
          {projects.map((p) => (
            <div className={`job${p.print ? "" : " print-hide"}`} key={p.slug}>
              <div className="job-head">
                <h3 className="job-name">
                  {p.href ? <a href={p.href} rel="noopener">{p.name}</a> : p.name}
                </h3>
                <span className="job-dates">{p.lang}</span>
              </div>
              <p className="job-meta run project-stack">{p.tech.slice(0, 6).map((t) => <span key={t}>{t}</span>)}</p>
              {/* One line on paper. The full account is on the project's own
                  page; a CV bullet that runs four lines does not get read. */}
              <ul><li>{p.resumeLine ?? p.summary}</li></ul>
            </div>
          ))}
        </div>
      </section>

      {/*
        Skills, curated and grouped, each saying where it actually stands.
        The list is chosen rather than derived from the topic vocabulary; the
        honesty is in the second line, which has to be specific enough to be
        wrong.

        `Measured` prints the share of my editor time from my own Wakapi, and
        renders nothing when the box is not publishing. On paper the second
        lines are hidden and this compresses back to names.
      */}
      <hr className="bleed" />
      <section className="row section" data-pagefind-body>
        <h2 className="rail rail--label"><Link href="/skills/">Skills</Link></h2>
        <div className="skill-groups">
          {skills.map((group) => (
            <div className="skill-group" key={group.group}>
              <h3>{group.group}</h3>
              <dl>
                {group.items.map((skill) => (
                  <React.Fragment key={skill.name}>
                    <dt>
                      {skill.topic && hasPage.has(skill.topic)
                        ? <Link href={`/topics/${skill.topic}/`}>{skill.name}</Link>
                        : skill.name}
                      {skill.wakatime && <Measured lang={skill.wakatime} />}
                    </dt>
                    <dd>{skill.now}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row section" data-pagefind-body>
        <h2 className="rail rail--label">Education</h2>
        <div>
          {education.map((e) => (
            <div className="job edu" key={e.school}>
              <div className="job-head">
                <h3 className="job-name">{e.school}</h3>
                <span className="job-dates">{e.when}</span>
              </div>
              <p className="job-meta run">
                <span>{e.degree}</span>
                <span>{e.detail}</span>
              </p>
              <ul className="print-hide"><li>{e.note}</li></ul>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
