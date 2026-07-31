import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import { site, feedTypes, projects } from "@/lib/site";
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
            {project.meta}
            <span className="sep">·</span>
            {project.status}
            {project.href && (
              <>
                <span className="sep">·</span>
                <a href={project.href} rel="noopener">source ↗</a>
              </>
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
        <p className="page-figures">
          <Link href="/projects/">every project</Link>
          <span className="sep">·</span>
          <a href={site.github} rel="noopener">github ↗</a>
        </p>
      </div>

      <Footer />
    </main>
  );
}
