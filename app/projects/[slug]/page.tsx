import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";
import Byline from "@/components/Byline";
import { site, projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { getProjectPosts } from "@/lib/posts";
import { Downloads } from "@/components/Measured";
import Lang from "@/components/Lang";
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
  return {
    ...pageMetadata({
      title: project.name,
      description: project.summary,
      path: `/projects/${slug}/`,
      ownCard: true,
    }),
    keywords: project.topics,
  };
}

/**
 * One project, and everything written about it.
 *
 * Measurements first, description second. What a project is measured at is
 * checkable; what it is *for* is my own account of it, and the checkable thing
 * goes on top. Every reading names where the figure came from, including the
 * ones that came from somewhere other than this repo — a number with no
 * provenance is the exact failure this site is built to avoid.
 *
 * Then the writing: every post whose `project` is this one, the write-up first.
 */
export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const posts = getProjectPosts(project.slug, project.writeup);
  // The write-up leads only when there is one; otherwise every post is equal.
  const [lead, rest] = project.writeup && posts.length > 0 ? [posts.slice(0, 1), posts.slice(1)] : [posts, []];

  return (
    <Shell current="projects">

      {/* Search indexes what describes the project, not the links around it. */}
      <div data-pagefind-body>
        <PageHead
          title={project.name}
          figures={
            <>
              <span>{project.lang}</span>{" "}
              <span>{project.shape}</span>{" "}
              <span>{project.status}</span>{" "}
              {project.href ? (
                <span><a href={project.href} rel="noopener">the repository</a></span>
              ) : (
                <span>private repository</span>
              )}
            </>
          }
          lede={project.summary}
        />
      </div>

      <ul className="topic-run" data-pagefind-body>
        {project.topics.map((t) => (
          <li key={t}>
            <Link prefetch={false} href={`/topics/${t}/`}>{topicName(t)}</Link>
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
      <section className="row" data-pagefind-body>
        <span className="rail rail--label">Built with</span>
        <div>
          <p className="tech-run run">
            {project.tech.flatMap((t) => [<span key={t}>{t}</span>, " "])}
          </p>
          {project.phase && <p className="project-phase">{project.phase}</p>}
        </div>
      </section>

      <hr className="bleed" />
      <section className="row" data-pagefind-body>
        <span className="rail rail--label">Readings</span>
        <ul className="readings">
          {project.readings.map((reading) => (
            <li key={reading.label}>
              <span className="reading-label">{reading.label}</span>{" "}
              <span className="reading-value">{reading.value}</span>{" "}
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
      <section className="row" data-pagefind-body>
        <span className="rail rail--label">What it is</span>
        <p><Lang text={project.description} lang={project.cyrillic} /></p>
      </section>

      {posts.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--against-body">
              <span className="rail--label">Writing</span>
              <span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
            </span>
            <div>
              <PostList posts={lead} />
              {rest.length > 0 && (
                <>
                  <span className="project-sublabel">More about it</span>
                  <PostList posts={rest} />
                </>
              )}
            </div>
          </section>
        </>
      )}

      <hr className="bleed" />
      <div className="row project-elsewhere">
        <span className="rail rail--label">Elsewhere</span>
        <div>
          {project.visibility === "private" && (
            <p className="page-lede">
              This repository is private, so there is nothing to click. Most of
              the rest is public on <a href={site.github} rel="noopener">my GitHub</a>,
              including the two built for other people to run: Attest and chargehand.
            </p>
          )}
          <p className="page-figures">
            <span><Link prefetch={false} href="/projects/">all projects</Link></span>{" "}
            <span><a href={site.github} rel="noopener">my GitHub</a></span>
          </p>
          <Byline title={project.name} />
        </div>
      </div>

    </Shell>
  );
}
