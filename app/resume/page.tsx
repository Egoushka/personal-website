import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ProfilePageLd } from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { site, feedTypes, skills, experience, education, projects } from "@/lib/site";

const description =
  "Résumé of Yehor Hrabovskyi — .NET backend engineer. Clean Architecture, CQRS, ASP.NET Core, Angular, self-hosted infrastructure.";

export const metadata: Metadata = {
  title: "Résumé",
  description,
  alternates: { canonical: "/resume/", types: feedTypes },
  openGraph: {
    type: "profile",
    title: `Résumé — ${site.name}`,
    description,
    url: `${site.url}/resume/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Résumé — ${site.name}`, description },
};

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/**
 * "Aug 2025 — present" -> "2025-08 — present".
 *
 * Numeric dates set in tabular figures, so the right-hand column of a printed
 * CV is a straight line instead of a ragged one. Derived rather than stored:
 * lib/site.ts stays the single human-readable source, and /resume/ is the only
 * page that wants this form.
 */
function isoDates(when: string): string {
  return when.replace(/([A-Z][a-z]{2}) (\d{4})/g, (_, mon: string, year: string) =>
    MONTHS[mon] ? `${year}-${MONTHS[mon]}` : `${mon} ${year}`,
  );
}

export default function Resume() {
  // The two oldest roles keep their bullets on screen and lose them in print.
  // That compression is what makes one A4 sheet possible; deleting them
  // outright would trade a real record for a layout constraint.
  const compactFrom = experience.length - 2;

  return (
    <main id="main" className="wrap resume">
      <Nav current="resume" />
      <ProfilePageLd />

      <div className="rail masthead-rail">
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={site.url}>{site.domain}</a>
        <a href={site.github} rel="noopener">github.com/{site.githubHandle}</a>
        <a href={site.linkedin} rel="noopener">linkedin.com/in/yehor-hrabovskyi</a>
        <span>Kyiv, Ukraine</span>
      </div>
      <div className="masthead">
        <h1>{site.name}</h1>
        <p className="role-title">{site.role}</p>
      </div>

      <p className="control print-hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>P</kbd> → one A4 page
      </p>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Experience</h2>
        <div>
          {experience.map((job, i) => (
            <div className={`job${i >= compactFrom ? " job--compact" : ""}`} key={job.company + job.when}>
              <div className="job-head">
                <h3 className="job-name">{job.company}</h3>
                <span className="job-dates">{isoDates(job.when)}</span>
              </div>
              <p className="job-meta">
                {job.role}
                {job.location && ` · ${job.location}`}
              </p>
              <ul>
                {job.points.map((pt, j) => (
                  <li key={j}>
                    {pt.text}
                    {pt.link && <Link href={pt.link.href}>{pt.link.label}</Link>}
                    {pt.after}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Projects</h2>
        <div>
          {projects.map((p) => (
            <div className="job" key={p.name}>
              <div className="job-head">
                <h3 className="job-name">
                  {p.href ? <a href={p.href} rel="noopener">{p.name}</a> : p.name}
                </h3>
                <span className="job-dates">{p.meta}</span>
              </div>
              <p className="job-meta">{p.tags.join(" · ")}</p>
              {/* One line on paper. The full description belongs on /projects/;
                  a CV bullet that runs four lines does not get read. */}
              <ul><li>{p.resumeLine ?? p.description}</li></ul>
            </div>
          ))}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Skills</h2>
        <p className="skills-run">{skills.join(" · ")}</p>
      </section>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Education</h2>
        <div>
          {education.map((e) => (
            <div className="job" key={e.school}>
              <div className="job-head">
                <h3 className="job-name">{e.school}</h3>
              </div>
              <p className="job-meta">{e.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
