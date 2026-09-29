import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import Byline from "@/components/Byline";
import PostEnhancements from "@/components/PostEnhancements";
import PostList from "@/components/PostList";
import ProjectCard from "@/components/ProjectCard";
import Prose from "@/components/Prose";
import { TocDisclosure, TocRail } from "@/components/Toc";
import { ArrowLeft, Calendar } from "@/components/ui/icons";
import { projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getAllPosts, tableOfContents } from "@/lib/posts";
import { getMethod, getMethodSlugs } from "@/lib/methods";
import { getTopicUsage } from "@/lib/readings";
import { TOPICS, isTopic, topicName } from "@/lib/topics";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getMethodSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const method = getMethod(slug);
  return {
    ...pageMetadata({
      title: method.title,
      description: method.description,
      path: `/methods/${slug}/`,
      type: "article",
    }),
    keywords: method.topics,
  };
}

/**
 * One method (ADR 0008): the rule, where it came from, what it costs and when I
 * break it, then the projects that follow it and the posts that tell the
 * stories. It reads like a post and is not one: no date, only the day it was
 * last reviewed, and no comments.
 */
export default async function MethodPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const method = getMethod(slug);
  const toc = tableOfContents(method.content);
  const followed = method.projects.flatMap((s) => projects.filter((p) => p.slug === s));
  const stories = getAllPosts().filter((p) => method.posts.includes(p.slug));
  // Only topics with a page of their own: a method is not counted on the hubs.
  const hubs = new Set<string>(getTopicUsage().map((t) => t.slug));
  const topics = method.topics.filter((t) => isTopic(t) && hubs.has(t));

  return (
    <Shell>
      <PostEnhancements key={slug} />

      <div className="mx-auto max-w-[64rem]">
        <header className="pt-10 md:pt-14" data-pagefind-body>
          <Link
            prefetch={false}
            href="/methods/"
            className="inline-flex min-h-6 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-pagefind-ignore
          >
            <ArrowLeft className="size-3.5" /> How I work
          </Link>
          <h1 className="mt-5 max-w-[46rem] font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {method.title}
          </h1>
          <p className="mt-5 max-w-[46rem] text-xl leading-relaxed text-muted-foreground text-pretty">{method.description}</p>
          <p className="page-figures mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground" data-pagefind-ignore>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>
                Last reviewed <time dateTime={method.lastReviewed}>{formatDate(method.lastReviewed)}</time>
              </span>
            </span>{" "}
            <span>
              Followed in {followed.length} {followed.length === 1 ? "project" : "projects"}
            </span>
          </p>
        </header>

        <div className="post-grid mt-10 border-t pt-10">
          {toc.length > 1 && <TocDisclosure entries={toc} className="post-toc-inline" />}

          <article className="post-body prose markdown markdown--post" data-pagefind-body>
            <Prose markdown={method.content} />
          </article>

          {toc.length > 1 && <TocRail entries={toc} className="post-aside" />}
        </div>

        <div className="max-w-[46rem]">
          <section className="mt-16" aria-labelledby="followed-in" data-pagefind-ignore>
            <h2 id="followed-in" className="text-sm font-medium text-muted-foreground">
              Followed in
            </h2>
            <ul className="mt-3 grid gap-3">
              {followed.map((p) => (
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

          {stories.length > 0 && (
            <section className="mt-14" aria-labelledby="stories" data-pagefind-ignore>
              <h2 id="stories" className="text-sm font-medium text-muted-foreground">
                The stories behind it
              </h2>
              <PostList posts={stories} className="mt-4" />
            </section>
          )}

          {topics.length > 0 && (
            <section className="mt-14" aria-labelledby="filed-under" data-pagefind-ignore>
              <h2 id="filed-under" className="text-sm font-medium text-muted-foreground">
                Filed under
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {topics.map((t) => (
                  <li key={t} className="group relative rounded-xl border p-4 transition-colors hover:border-input hover:bg-accent/40">
                    <Link prefetch={false} href={`/topics/${t}/`} className="font-medium after:absolute after:inset-0 after:rounded-xl">
                      {topicName(t)}
                    </Link>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{TOPICS[t].blurb}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-14 rounded-xl border bg-card p-5">
            <Byline title={method.title} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
