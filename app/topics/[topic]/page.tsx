import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";
import { site, feedTypes, projects, experience, skills } from "@/lib/site";
import { getPostsByTopic } from "@/lib/posts";
import { TOPICS, isTopic, topicName } from "@/lib/topics";
import { getTopicUsage } from "@/lib/readings";

type Params = { topic: string };

/**
 * Everything about one topic, in one place.
 *
 * This is the page the whole single-vocabulary refactor exists for: somebody who
 * cares about Postgres should see the posts, the projects **and the paid work**
 * in one view. `Job.topics` is what makes the last one possible, and it is the
 * difference between a topic page that proves something and one that just proves
 * I have a side project.
 *
 * Only topics something actually references get a page. An empty hub is worse
 * than a 404 — it is a promise the site cannot keep. `getTopicUsage()` is the
 * single answer to that question; this page, the sitemap and the home page all
 * ask it there rather than each reimplementing the filter.
 */
export function generateStaticParams(): Params[] {
  return getTopicUsage().map((t) => ({ topic: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { topic } = await params;
  const label = topicName(topic);
  const description = isTopic(topic)
    ? TOPICS[topic].blurb
    : `Everything about ${label} by ${site.name}.`;
  const url = `${site.url}/topics/${topic}/`;
  return {
    title: label,
    description,
    alternates: { canonical: url, types: feedTypes },
    openGraph: {
      type: "website",
      title: `${label} — ${site.name}`,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
    },
    twitter: { card: "summary_large_image", title: `${label} — ${site.name}`, description },
  };
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { topic } = await params;
  if (!isTopic(topic)) notFound();

  const posts = getPostsByTopic(topic);
  const built = projects.filter((p) => (p.topics as string[]).includes(topic));
  const jobs = experience.filter((j) => (j.topics as string[]).includes(topic));
  const now = skills.flatMap((g) => g.items).find((s) => s.topic === topic)?.now;
  if (posts.length + built.length + jobs.length === 0) notFound();

  const others = getTopicUsage()
    .map((t) => t.slug)
    .filter((t) => t !== topic);

  return (
    <Shell>

      <PageHead
        title={topicName(topic)}
        figures={
          <>
            <span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
            <span>{built.length} {built.length === 1 ? "project" : "projects"}</span>
            <span>{jobs.length} {jobs.length === 1 ? "role" : "roles"}</span>
            <span>{TOPICS[topic].kind}</span>
          </>
        }
        lede={TOPICS[topic].blurb}
      />

      {/*
        Where this one actually stands, from the curated skills list rather
        than a second field here. `blurb` is reused in five places — the meta
        description, the OG card, the graph's hover note and its aria-label —
        so it cannot grow into a paragraph; `now` can, and it lives beside the
        claim it qualifies on the CV.
      */}
      {now && <p className="topic-now">{now}</p>}

      {posts.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--label">Writing</span>
            <PostList posts={posts} />
          </section>
        </>
      )}

      {built.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--label">Projects</span>
            <ol className="project-list">
              {built.map((p) => (
                <li className="project-row" key={p.slug}>
                  <h2 className="project-name">
                    <Link href={`/projects/${p.slug}/`}>{p.name}</Link>
                  </h2>
                  <span className="project-status run"><span>{p.lang}</span><span>{p.shape}</span><span>{p.status}</span></span>
                  <p>{p.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {/*
        The paid work. This is the half of a topic page that most personal sites
        cannot show, because their tags only ever touch blog posts.
      */}
      {jobs.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--label">Used at work</span>
            <div>
              {jobs.map((job) => (
                <div className="job" key={job.company + job.when}>
                  <div className="job-head">
                    <h2 className="job-name">{job.company}</h2>
                    <span className="job-dates">{job.when}</span>
                  </div>
                  <p className="job-meta">{job.role}</p>
                </div>
              ))}
              <p className="page-figures">
                The whole record is on the <Link href="/cv/">CV</Link>.
              </p>
            </div>
          </section>
        </>
      )}

      {others.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--label">Other topics</span>
            <ul className="topic-run">
              {others.map((t) => (
                <li key={t}>
                  <Link href={`/topics/${t}/`}>{topicName(t)}</Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

    </Shell>
  );
}
