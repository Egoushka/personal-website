import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { highlighter, shikiOptions } from "@/lib/highlight";
import rehypeSlug from "rehype-slug";
import Nav from "@/components/Nav";
import { BlogPostingLd } from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { site, feedTypes } from "@/lib/site";
import {
  getAllSlugs,
  getPost,
  formatDate,
  tableOfContents,
  getRelatedPosts,
} from "@/lib/posts";
import { getReadings, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  const url = `${site.url}/writing/${slug}/`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.topics,
    alternates: { canonical: url, types: feedTypes },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName: site.name,
      locale: site.locale,
      publishedTime: post.date,
      authors: [site.name],
      tags: post.topics,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
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
  const daysAgo = Math.round(
    (Date.parse(getReadings().builtOn) - Date.parse(post.date)) / 86_400_000,
  );

  return (
    <>
      <main id="main" className="wrap">
        <Nav current="writing" />
        <BlogPostingLd post={post} />

        <article className="prose">
        {/*
          The header rail is the article's first child, not a sibling: it has to
          share grid rows with the h1 and the standfirst, and a sibling of the
          subgrid can only ever start its own row.
        */}
        <div className="rail rail--header">
          {post.topics.length > 0 && (
            <span className="rail--topics">
              {post.topics.map((t) => (
                <Link key={t} href={`/topics/${t}/`}>{topicName(t)}</Link>
              ))}
            </span>
          )}

          {/*
            Static links, no current-item highlight: CSS cannot select a TOC entry
            from a :target further down the document, and scroll-spy JS is not an
            option on this site. `h2:target` in globals.css gives the reader
            confirmation of where they landed instead, in the prose column.
            Below 900px this collapses to a closed <details> — the only place the
            rail becomes interactive, and it needs no JavaScript.
          */}
          {toc.length > 1 && (
            <details className="toc-details rail--group">
              <summary>On this page · {toc.length}</summary>
              <span className="rail--label">On this page</span>
              <ol className="toc">
                {toc.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </details>
          )}
        </div>

          <h1>{post.title}</h1>
          <p className="page-figures">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="sep">·</span>
            {n(post.wordCount)} words
            <span className="sep">·</span>
            {post.readingTime} min read
            <span className="sep">·</span>
            {daysAgo} days ago
          </p>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeSlug,
              [rehypeShikiFromHighlighter, highlighter, shikiOptions],
            ]}
            components={{
              /*
                Every h2 gets a full-bleed hairline above it and its number in the
                rail. The number is a CSS counter, so nothing in the markdown
                pipeline has to know about section numbering.
              */
              h2: ({ children, ...props }) => (
                <>
                  <hr className="bleed" />
                  <div className="row">
                    <span className="rail rail--section" aria-hidden="true" />
                    <h2 {...props}>{children}</h2>
                  </div>
                </>
              ),
              /*
                The code block is hung off the rail: language label and copy
                button in the margin, the block itself bleeding left into the
                gutter. The copy button is server-rendered inside React's tree —
                an earlier version injected it after parse, and hydration
                reconciled the <pre> and stripped it back out.
              */
              pre: ({ children, className, ...props }) => {
                const lang = extractLang(children, props);
                return (
                  <div className="row">
                    <div className="rail">
                      {lang && <span className="rail--label">{lang}</span>}
                      <button type="button" className="copy-btn" aria-label="Copy code to clipboard">
                        copy
                      </button>
                    </div>
                    {/*
                      Shiki puts its own className on the <pre> it produces. It has
                      to be merged, not spread over the top: `{...props}` after a
                      literal className silently dropped `bleed-code`, so
                      highlighted blocks stopped bleeding into the gutter while
                      untagged ones still did.
                    */}
                    <pre className={`bleed-code${className ? ` ${className}` : ""}`} {...props}>
                      {children}
                    </pre>
                  </div>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

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

        {/* One link, not a grid of cards. */}
        {related && (
          <>
            <hr className="bleed" />
            <div className="row">
              <span className="rail rail--label">Read next</span>
              <div className="post-item">
                <h2><Link href={`/writing/${related.slug}/`}>{related.title}</Link></h2>
                <p>{formatDate(related.date)} · {related.readingTime} min read</p>
              </div>
            </div>
          </>
        )}

        {/*
          One delegated listener on document, rather than a listener per button:
          it survives any DOM reconciliation and costs nothing per code block.
          Still a plain script and not a client component — a React island for one
          button would put hydration on every post. The button lives in the rail,
          so it walks up to .row rather than to its parent.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".copy-btn"); if(!b) return;
  var row=b.closest(".row"); if(!row) return;
  var pre=row.querySelector("pre"); if(!pre) return;
  var code=pre.querySelector("code")||pre;
  // clipboard is undefined outside a secure context; bail rather than throw
  if(!navigator.clipboard){ b.textContent="no clipboard"; return; }
  navigator.clipboard.writeText(code.innerText).then(function(){
    b.textContent="copied"; b.classList.add("is-copied");
    setTimeout(function(){b.textContent="copy";b.classList.remove("is-copied")},1600);
  },function(){ b.textContent="failed"; });
});`,
          }}
        />
      </main>
      <div className="wrap"><Footer /></div>
    </>
  );
}

/**
 * The source language, for the rail label.
 *
 * Two shapes to handle: rehype-shiki moves the language onto the <pre> as
 * `data-language` and strips `language-*` off the <code>, while an untagged
 * fence never had one at all. Reading only the <code> className found nothing
 * on exactly the blocks that were highlighted.
 */
function extractLang(
  children: React.ReactNode,
  preProps: Record<string, unknown>,
): string | null {
  const fromPre = preProps["data-language"];
  if (typeof fromPre === "string" && fromPre && fromPre !== "text") return fromPre;

  const child = Array.isArray(children) ? children[0] : children;
  const cls = (child as { props?: { className?: string } })?.props?.className ?? "";
  const hit = /language-([\w-]+)/.exec(cls);
  return hit ? hit[1] : null;
}
