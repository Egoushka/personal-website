import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { BlogPostingLd } from "@/components/JsonLd";
import Comments from "@/components/Comments";
import Byline from "@/components/Byline";
import KindLabel from "@/components/KindLabel";
import PostEnhancements from "@/components/PostEnhancements";
import Lang from "@/components/Lang";
import Prose from "@/components/Prose";
import StatusBadge from "@/components/StatusBadge";
import { TocDisclosure, TocRail } from "@/components/Toc";
import { ArrowLeft, ArrowRight, Calendar, Clock, Folder } from "@/components/ui/icons";
import { projects, site } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import {
  getAllSlugs,
  getPost,
  formatDate,
  tableOfContents,
  getRelatedPosts,
} from "@/lib/posts";
import { getTopicUsage, n } from "@/lib/readings";
import { TOPICS, isTopic, topicName } from "@/lib/topics";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  const base = pageMetadata({
    title: post.title,
    description: post.description,
    path: `/writing/${slug}/`,
    type: "article",
    ownCard: true,
  });
  return {
    ...base,
    keywords: post.topics,
    openGraph: {
      ...base.openGraph,
      type: "article",
      // The bare title: the site name is og:site_name, and the card says it too.
      title: post.title,
      publishedTime: post.date,
      authors: [site.name],
      tags: post.topics.map(topicName),
    },
  };
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const post = getPost(slug);
  const toc = tableOfContents(post.content);
  const related = getRelatedPosts(slug, 1)[0];
  const usage = getTopicUsage();
  const project = projects.find((p) => p.slug === post.project);

  return (
    <Shell current="writing">
      <BlogPostingLd post={post} />
      <PostEnhancements key={slug} />

      <div className="mx-auto max-w-[64rem]">
        {/*
          The title block sits above the two columns, not in a row the contents
          list spans: a long list would push the date far below its title.
          Search indexes this block and the article, and nothing else.
        */}
        <header className="pt-10 md:pt-14" data-pagefind-body>
          <Link
            prefetch={false}
            href="/writing/"
            className="inline-flex min-h-6 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-pagefind-ignore
          >
            <ArrowLeft className="size-3.5" /> All writing
          </Link>
          <h1 className="mt-5 max-w-[46rem] font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            <Lang text={post.title} lang={post.cyrillic} />
          </h1>
          <p className="mt-5 max-w-[46rem] text-xl leading-relaxed text-muted-foreground text-pretty">{post.description}</p>
          <p className="page-figures mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground" data-pagefind-ignore>
            <KindLabel kind={post.kind} />{" "}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>{" "}
            {post.updated && (
              <>
                <span>
                  Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </span>{" "}
              </>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {post.readingTime} min read
            </span>{" "}
            <span>{n(post.wordCount)} words</span>
            {project && (
              <>
                {" "}
                <Link
                  prefetch={false}
                  href={`/projects/${project.slug}/`}
                  className="inline-flex min-h-6 items-center gap-1.5 rounded-md border px-2 font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Folder className="size-3.5 text-muted-foreground" />
                  {project.name}
                </Link>
              </>
            )}
          </p>
        </header>

        <div className="post-grid mt-10 border-t pt-10">
          {toc.length > 1 && <TocDisclosure entries={toc} className="post-toc-inline" />}

          <article className="post-body prose markdown markdown--post" data-pagefind-body>
            {post.correction && (
              <p className="post-correction not-prose mb-8" role="note">
                <span className="font-semibold text-foreground">Correction.</span> {post.correction}
              </p>
            )}
            <Prose markdown={post.content} cyrillic={post.cyrillic} />
          </article>

          {toc.length > 1 && <TocRail entries={toc} className="post-aside" />}
        </div>

        <div className="max-w-[46rem]">
          <div className="mt-16 rounded-xl border bg-card p-5">
            <Byline title={post.title} />
          </div>

          {/*
            The one measurement a piece of writing can make about itself: the
            words spent against the stretch of time they report on. Only when
            the post declares that stretch; a span is never inferred.
          */}
          {post.spanDays ? (
            <p className="mt-4 text-sm text-muted-foreground">
              For scale: {n(post.wordCount)} words about {post.spanDays} days, or{" "}
              {Math.round(post.wordCount / post.spanDays)} words for every day of it.
            </p>
          ) : null}

          {project && (
            <section className="mt-14" aria-labelledby="about-project">
              <h2 id="about-project" className="text-sm font-medium text-muted-foreground">
                About the project
              </h2>
              <div className="group relative mt-3 rounded-xl border bg-card p-5 transition-colors hover:border-input hover:bg-accent/40">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold tracking-tight">
                    <Link prefetch={false} href={`/projects/${project.slug}/`} className="after:absolute after:inset-0 after:rounded-xl">
                      {project.name}
                    </Link>
                  </p>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
              </div>
            </section>
          )}

          {/*
            Topics, at the end, where a filing decision belongs: what the topic
            is, and how much else is under it.
          */}
          {post.topics.length > 0 && (
            <section className="mt-14" aria-labelledby="filed-under" data-pagefind-ignore>
              <h2 id="filed-under" className="text-sm font-medium text-muted-foreground">
                Filed under
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {post.topics.filter(isTopic).map((t) => {
                  const u = usage.find((x) => x.slug === t);
                  return (
                    <li key={t} className="group relative rounded-xl border p-4 transition-colors hover:border-input hover:bg-accent/40">
                      <Link prefetch={false} href={`/topics/${t}/`} className="font-medium after:absolute after:inset-0 after:rounded-xl">
                        {topicName(t)}
                      </Link>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{TOPICS[t].blurb}</p>
                      {/* Only what the topic has: "0 projects" is true and reads as a shortfall. */}
                      {u && (
                        <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground tabular-nums">
                          {u.posts > 0 && <span>{u.posts} {u.posts === 1 ? "post" : "posts"}</span>}{" "}
                          {u.projects > 0 && <span>{u.projects} {u.projects === 1 ? "project" : "projects"}</span>}{" "}
                          {u.jobs > 0 && <span>{u.jobs} {u.jobs === 1 ? "role" : "roles"}</span>}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* One link, not a grid of cards. */}
          {related && (
            <section className="mt-14" aria-labelledby="read-next" data-pagefind-ignore>
              <h2 id="read-next" className="text-sm font-medium text-muted-foreground">
                Read next
              </h2>
              <div className="group relative mt-3 flex items-center gap-4 rounded-xl border p-5 transition-colors hover:border-input hover:bg-accent/40">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight">
                    <Link prefetch={false} href={`/writing/${related.slug}/`} className="after:absolute after:inset-0 after:rounded-xl">
                      <Lang text={related.title} lang={related.cyrillic} />
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(related.date)} · {related.readingTime} min read
                  </p>
                </div>
                <ArrowRight className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </section>
          )}

          <Comments key={slug} url={`${site.url}/writing/${post.slug}/`} />
        </div>
      </div>
    </Shell>
  );
}
