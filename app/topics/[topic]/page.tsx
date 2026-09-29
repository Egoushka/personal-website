import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";
import ProjectCard from "@/components/ProjectCard";
import { site, projects, experience, skills } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { formatSpan } from "@/lib/dates";
import { getPostsByTopic } from "@/lib/posts";
import { TOPICS, isTopic, topicName } from "@/lib/topics";
import { getTopicUsage } from "@/lib/readings";

type Params = { topic: string };

/**
 * Everything about one topic, in one place.
 *
 * Somebody who cares about Postgres should see the posts, the projects **and
 * the paid work** in one view. `Job.topics` is what makes the last one possible, and it is the
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
    ? `${label} — ${TOPICS[topic].blurb}`
    : `Everything about ${label} by ${site.name}.`;
  const metadata = pageMetadata({ title: label, description, path: `/topics/${topic}/` });
  // One post, project or role is not a hub worth a search result, but its links
  // still lead somewhere. Kept out of app/sitemap.ts by the same test.
  const usage = getTopicUsage().find((t) => t.slug === topic);
  return usage && usage.total >= 2 ? metadata : { ...metadata, robots: { index: false, follow: true } };
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
        eyebrow={<span className="text-sm text-muted-foreground">Topic</span>}
        figures={
          <>
            <span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>{" "}
            <span>{built.length} {built.length === 1 ? "project" : "projects"}</span>{" "}
            <span>{jobs.length} {jobs.length === 1 ? "role" : "roles"}</span>{" "}
            <span>{TOPICS[topic].kind}</span>
          </>
        }
        lede={TOPICS[topic].blurb}
      />

      {/*
        Where this one actually stands, from the curated skills list rather
        than a second field here. `blurb` is reused in five places, so it cannot
        grow into a paragraph; `now` can, and it lives beside the claim it
        qualifies on the CV.
      */}
      {now && (
        <div className="mb-4 max-w-3xl rounded-xl border bg-muted/50 p-5">
          <p className="text-sm font-semibold">Where it stands</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{now}</p>
        </div>
      )}

      {posts.length > 0 && (
        <section className="border-t py-10" aria-labelledby="topic-writing">
          <h2 id="topic-writing" className="text-2xl font-semibold tracking-tight">Writing</h2>
          <PostList posts={posts} className="mt-6" />
        </section>
      )}

      {built.length > 0 && (
        <section className="border-t py-10" aria-labelledby="topic-projects">
          <h2 id="topic-projects" className="text-2xl font-semibold tracking-tight">Projects</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {built.map((p) => (
              <ProjectCard
                key={p.slug}
                p={{
                  slug: p.slug,
                  name: p.name,
                  lang: p.lang,
                  shape: p.shape,
                  status: p.status,
                  summary: p.summary,
                  repo: p.visibility === "public" && p.href ? p.href : undefined,
                }}
              />
            ))}
          </ul>
        </section>
      )}

      {/*
        The paid work: the half of a topic page most personal sites cannot show,
        because their tags only ever touch blog posts.
      */}
      {jobs.length > 0 && (
        <section className="border-t py-10" aria-labelledby="topic-work">
          <h2 id="topic-work" className="text-2xl font-semibold tracking-tight">Used at work</h2>
          <ul className="mt-6 divide-y rounded-xl border">
            {jobs.map((job) => (
              <li className="job flex flex-wrap items-baseline justify-between gap-2 px-5 py-4" key={job.company + job.start}>
                <div>
                  <h3 className="job-name">{job.company}</h3>
                  <p className="job-meta">{job.role}</p>
                </div>
                <span className="job-dates">{formatSpan(job)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            The whole record is on the <Link className="link" prefetch={false} href="/cv/">CV</Link>.
          </p>
        </section>
      )}

      {others.length > 0 && (
        <section className="border-t py-10" aria-labelledby="topic-others">
          <h2 id="topic-others" className="text-sm font-medium text-muted-foreground">Other topics</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((t) => (
              <li key={t}>
                <Link
                  prefetch={false}
                  href={`/topics/${t}/`}
                  className="inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors hover:border-input hover:bg-accent"
                >
                  {topicName(t)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </Shell>
  );
}
