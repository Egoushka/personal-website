import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ProfilePageLd } from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { site, feedTypes, experience, education, projects } from "@/lib/site";
import { TOPICS, topicName, type TopicSlug } from "@/lib/topics";

const description =
  "CV of Yehor Hrabovskyi — .NET backend engineer. Clean Architecture, CQRS, ASP.NET Core, Angular, self-hosted infrastructure.";

export const metadata: Metadata = {
  title: "CV",
  description,
  alternates: { canonical: "/cv/", types: feedTypes },
  openGraph: {
    type: "profile",
    title: `CV — ${site.name}`,
    description,
    url: `${site.url}/cv/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `CV — ${site.name}`, description },
};

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/**
 * "Aug 2025 — present" -> "2025-08 — present".
 *
 * Numeric dates set in tabular figures, so the right-hand column of a printed CV
 * is a straight line instead of a ragged one. Derived rather than stored:
 * lib/site.ts stays the single human-readable source, and this is the only page
 * that wants this form.
 */
function isoDates(when: string): string {
  return when.replace(/([A-Z][a-z]{2}) (\d{4})/g, (_, mon: string, year: string) =>
    MONTHS[mon] ? `${year}-${MONTHS[mon]}` : `${mon} ${year}`,
  );
}

/**
 * The skills line, derived rather than typed.
 *
 * There used to be a hand-maintained `skills` array in lib/site.ts that had
 * drifted from both the jobs and the projects it was supposed to summarise. This
 * is every technology topic that some role or project actually references, in
 * vocabulary order — so it cannot claim anything the rest of the site does not
 * already back up.
 */
function skillsFromRecord(): string[] {
  const used = new Set<TopicSlug>();
  for (const job of experience) for (const t of job.topics) used.add(t);
  for (const project of projects) for (const t of project.topics) used.add(t);
  return [...used]
    .filter((t) => TOPICS[t].kind === "technology")
    .map(topicName);
}

export default function CV() {
  const skills = skillsFromRecord();

  return (
    <main id="main" className="wrap cv">
      {/* No `current`: the CV is no longer a navigation section. It lives in the
          footer now, so there is nothing in the header for it to mark. */}
      <Nav />
      <ProfilePageLd />

      <div className="rail masthead-rail">
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={site.url}>{site.domain}</a>
        <a href={site.github} rel="noopener">github.com/{site.githubHandle}</a>
        <a href={site.linkedin} rel="noopener">linkedin.com/in/{site.linkedinHandle}</a>
        <span>{site.location}</span>
      </div>
      <div className="masthead">
        <h1>{site.name}</h1>
        <p className="role-title">{site.role}</p>
      </div>

      <p className="control print-hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>P</kbd> prints one A4 page
      </p>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Experience</h2>
        <div>
          {/* `resumeCompact` roles keep their bullets on screen and lose them in
              print — the compression that makes one A4 sheet possible. Deleting
              them outright would trade a real record for a layout constraint. */}
          {experience.map((job) => (
            <div className={`job${job.resumeCompact ? " job--compact" : ""}`} key={job.company + job.when}>
              <div className="job-head">
                <h3 className="job-name">{job.company}</h3>
                <span className="job-dates">{isoDates(job.when)}</span>
              </div>
              <p className="job-meta run">
                <span>{job.role}</span>
                {job.focus && <span>{job.focus}</span>}
                {job.location && <span>{job.location}</span>}
                {job.mode && <span>{job.mode}</span>}
              </p>
              <ul>
                {job.points.map((pt, j) => (
                  <li key={j}>
                    {pt.text}
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
            <div className="job" key={p.slug}>
              <div className="job-head">
                <h3 className="job-name">
                  {p.href ? <a href={p.href} rel="noopener">{p.name}</a> : p.name}
                </h3>
                <span className="job-dates">{p.lang}</span>
              </div>
              <p className="job-meta run">{p.topics.map((t) => <span key={t}>{topicName(t)}</span>)}</p>
              {/* One line on paper. The full account is on the project's own
                  page; a CV bullet that runs four lines does not get read. */}
              <ul><li>{p.resumeLine ?? p.summary}</li></ul>
            </div>
          ))}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row section">
        <h2 className="rail rail--label">Skills</h2>
        <p className="skills-run run">{skills.map((s) => <span key={s}>{s}</span>)}</p>
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
