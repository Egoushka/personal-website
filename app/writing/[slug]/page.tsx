import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { BlogPostingLd } from "@/components/JsonLd";
import Comments from "@/components/Comments";
import Byline from "@/components/Byline";
import PostEnhancements from "@/components/PostEnhancements";
import Lang from "@/components/Lang";
import Prose from "@/components/Prose";
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

      {/*
        The title and its figures are their own block above the two-column
        body, not rows the sidebar spans: a grid item spanning auto-sized rows
        makes those rows grow to hold it, and a long contents list would push
        the date far below the title it belongs to.

        Search indexes this block and the article, and nothing else on the page.
      */}
      <header className="post-head" data-pagefind-body>
        <h1><Lang text={post.title} lang={post.cyrillic} /></h1>
        <p className="page-figures" data-pagefind-ignore>
          <span><time dateTime={post.date}>{formatDate(post.date)}</time></span>{" "}
          {post.updated && (
            <><span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>{" "}</>
          )}
          <span>{n(post.wordCount)} words</span>{" "}
          <span>{post.readingTime} min read</span>
          {project && (
            <>{" "}<span><Link prefetch={false} href={`/projects/${project.slug}/`}>{project.name}</Link></span></>
          )}
        </p>
      </header>

      {/*
        One grid row holding a sticky rail and the article, rather than the
        article spanning both columns. This is what lets the contents list
        follow the reader the whole way down: a sticky item travels its grid
        area, and here that area is the full height of the post.
      */}
      <div className="post-layout">
        {toc.length > 1 && (
          <aside className="post-aside">
            {/*
              Below 900px this collapses to a closed <details> — the one place
              the rail becomes interactive without JavaScript. Above it the
              disclosure dissolves and the list is a plain sticky column.

              The current-section mark is JavaScript (PostEnhancements), and
              it is additive: the links are in the static HTML and work with
              the indicator never moving.
            */}
            <details className="toc-details rail--group">
              <summary data-pagefind-ignore>On this page <span className="rail-count">{toc.length}<span className="visually-hidden"> sections</span></span></summary>
              <span className="rail--label">On this page</span>
              <ol className="toc">
                {toc.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </details>
          </aside>
        )}

        <article className="prose post-body" data-pagefind-body>
          {post.correction && (
            <p className="post-correction" role="note">
              <span className="rail--label">Correction</span> {post.correction}
            </p>
          )}
          <Prose markdown={post.content} cyrillic={post.cyrillic} />
        </article>
      </div>

      <div className="row post-byline">
        <Byline title={post.title} />
      </div>

      {/*
        The one measurement a piece of writing can make about itself: the words
        spent against the stretch of time they report on. Printed only when the
        post declares that stretch in its frontmatter — there is no default,
        and a span is never inferred from the prose.
      */}
      {post.spanDays ? (
        <div className="row">
          <span className="rail rail--label">For scale</span>
          <p className="page-figures">
            {n(post.wordCount)} words about {post.spanDays} days —{" "}
            {Math.round(post.wordCount / post.spanDays)} words for every day of it.
          </p>
        </div>
      ) : null}

      {project && (
        <>
          <hr className="bleed" />
          <div className="row">
            <span className="rail rail--label">About the project</span>
            <div className="post-item">
              <h2><Link prefetch={false} href={`/projects/${project.slug}/`}>{project.name}</Link></h2>
              <p className="run"><span>{project.status}</span></p>
              <p>{project.summary}</p>
            </div>
          </div>
        </>
      )}

      {/*
        Topics, at the end, where a filing decision belongs, carrying what the
        reader wants from one: what the topic is, and how much else is under it.
      */}
      {post.topics.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="filed bleed" aria-labelledby="filed-under" data-pagefind-ignore>
            <h2 className="rail--label" id="filed-under">Filed under</h2>
            <ul className="filed-list">
              {post.topics.filter(isTopic).map((t) => {
                const u = usage.find((x) => x.slug === t);
                return (
                  <li className="filed-item" key={t}>
                    <Link prefetch={false} href={`/topics/${t}/`}>{topicName(t)}</Link>
                    <p>{TOPICS[t].blurb}</p>
                    {/* Only what the topic actually has: "0 projects" is a
                        true statement that reads as a shortfall. */}
                    {u && (
                      <span className="run filed-count">
                        {u.posts > 0 && <span>{u.posts} {u.posts === 1 ? "post" : "posts"}</span>}{" "}
                        {u.projects > 0 && <span>{u.projects} {u.projects === 1 ? "project" : "projects"}</span>}{" "}
                        {u.jobs > 0 && <span>{u.jobs} {u.jobs === 1 ? "role" : "roles"}</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {/* One link, not a grid of cards. */}
      {related && (
        <>
          <hr className="bleed" />
          <div className="row" data-pagefind-ignore>
            <span className="rail rail--label">Read next</span>
            <div className="post-item">
              <h2><Link prefetch={false} href={`/writing/${related.slug}/`}><Lang text={related.title} lang={related.cyrillic} /></Link></h2>
              <p className="run"><span>{formatDate(related.date)}</span>{" "}<span>{related.readingTime} min read</span></p>
            </div>
          </div>
        </>
      )}

      <hr className="bleed" />
      <Comments key={slug} url={`${site.url}/writing/${post.slug}/`} />
    </Shell>
  );
}
