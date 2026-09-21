import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import { site, feedTypes, projects } from "@/lib/site";
import { Downloads } from "@/components/Measured";
import { topicName } from "@/lib/topics";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  const url = `${site.url}/projects/${slug}/`;
  return {
    title: project.name,
    description: project.summary,
    keywords: project.topics,
    alternates: { canonical: url, types: feedTypes },
    openGraph: {
      type: "website",
      title: `${project.name} — ${site.name}`,
      description: project.summary,
      url,
      siteName: site.name,
      locale: site.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} — ${site.name}`,
      description: project.summary,
    },
  };
}

/**
 * One project.
 *
 * Measurements first, description second. What a project is measured at is
 * checkable; what it is *for* is my own account of it, and the checkable thing
 * goes on top. Every reading names where the figure came from, including the
 * ones that came from somewhere other than this repo — a number with no
 * provenance is the exact failure this site is built to avoid.
 */
export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main id="main" className="wrap">
      <Nav current="projects" />

      <PageHead
        title={project.name}
        figures={
          <>
            <span>{project.lang}</span>
            <span>{project.shape}</span>
            <span>{project.status}</span>
            {project.href ? (
              <span><a href={project.href} rel="noopener">the repository</a></span>
            ) : (
              <span>private repository</span>
            )}
          </>
        }
        lede={project.summary}
      />

      <ul className="topic-run">
        {project.topics.map((t) => (
          <li key={t}>
            <Link href={`/topics/${t}/`}>{topicName(t)}</Link>
          </li>
        ))}
      </ul>

      {/*
        What it is built with, read out of the repository rather than
        remembered, and where it has got to. The phase line is only ever
        printed when the project itself declares stages, and it has to name
        what does not exist yet: that is the half a reader cannot check, and
        it is what makes the rest believable.
      */}
      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--label">Built with</span>
        <div>
          <p className="tech-run run">
            {project.tech.map((t) => <span key={t}>{t}</span>)}
          </p>
          {project.phase && <p className="project-phase">{project.phase}</p>}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--label">Readings</span>
        <ul className="readings">
          {project.readings.map((reading) => (
            <li key={reading.label}>
              <span className="reading-label">{reading.label}</span>
              <span className="reading-value">{reading.value}</span>
              <span className="reading-source">{reading.source}</span>
            </li>
          ))}
          {/* Counted by NuGet rather than by me, which is the whole point of
              it. Absent until the box publishes it, like everything else that
              is true now rather than true at build. */}
          {project.slug === "attest" && <Downloads />}
        </ul>
      </section>

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--label">What it is</span>
        <p>{project.description}</p>
      </section>

      <hr className="bleed" />
      <div className="row">
        <span className="rail rail--label">Elsewhere</span>
        <div>
          {project.visibility === "private" && (
            <p className="page-lede">
              This repository is private, so there is nothing to click. The
              public half of what I build — including the one thing here anyone
              can install — is on{" "}
              <a href={site.github} rel="noopener">my GitHub</a>.
            </p>
          )}
          <p className="page-figures">
            <span><Link href="/projects/">all projects</Link></span>
            <span><a href={site.github} rel="noopener">my GitHub</a></span>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
