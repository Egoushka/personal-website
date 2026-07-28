import type { Metadata } from "next";
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

export default function Resume() {
  return (
    <>
      <Nav />
      <main id="main">
        <ProfilePageLd />
        <section className="page-head" aria-labelledby="resume-heading">
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> cat resume.md</div>
            <h1 id="resume-heading">{site.name}</h1>
            <p className="resume-role">{site.role}</p>

            <ul className="resume-contact">
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              <li><a href={site.url}>{site.domain}</a></li>
              <li><a href={site.github} rel="noopener">github.com/{site.githubHandle}</a></li>
              <li><a href={site.linkedin} rel="noopener">linkedin.com/in/yehor-hrabovskyi</a></li>
            </ul>

            <p className="resume-print-hint">
              Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>P</kbd> to save this as a PDF — it is
              styled for print, and unlike a checked-in file it can never go stale.
            </p>

            <h2 className="resume-h2">Experience</h2>
            <div className="timeline">
              {experience.map((job) => (
                <div className="job" key={job.company + job.when}>
                  <div className="when">
                    {job.when}
                    {job.location && <span className="job-loc"> · {job.location}</span>}
                  </div>
                  <h3>{job.company}</h3>
                  <div className="role">{job.role}</div>
                  <ul>
                    {job.points.map((pt, i) => (
                      <li key={i}>
                        {pt.text}
                        {pt.link && <Link href={pt.link.href}>{pt.link.label}</Link>}
                        {pt.after}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2 className="resume-h2">Selected projects</h2>
            <div className="timeline">
              {projects.filter((p) => p.name !== "More on GitHub").map((p) => (
                <div className="job" key={p.name}>
                  <h3><a href={p.href} rel="noopener">{p.name}</a></h3>
                  <div className="role">{p.tags.join(" · ")}</div>
                  <p className="resume-project-desc">{p.description}</p>
                </div>
              ))}
            </div>

            <h2 className="resume-h2">Skills</h2>
            <div className="chips">
              {skills.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>

            <h2 className="resume-h2">Education</h2>
            <div className="timeline">
              {education.map((e) => (
                <div className="job" key={e.school}>
                  <h3>{e.school}</h3>
                  <div className="role">{e.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
