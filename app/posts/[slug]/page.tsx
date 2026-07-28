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
import { getAllSlugs, getPost, formatDate, tableOfContents, getRelatedPosts, getAdjacentPosts } from "@/lib/posts";
import { tagLabel } from "@/lib/tags";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  const url = `${site.url}/posts/${slug}/`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
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
      tags: post.tags,
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
  const related = getRelatedPosts(slug);
  const { prev, next } = getAdjacentPosts(slug);
  return (
    <>
      <Nav />
      <main id="main" className="wrap article">
        <Link className="back" href="/blog/">← back to blog</Link>
        <BlogPostingLd post={post} />
        <article>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {` · ${post.readingTime} min read`}
            {post.tags.map((t) => (
              <span key={t}>
                {" · "}
                <Link href={`/tags/${t}/`}>{tagLabel(t)}</Link>
              </span>
            ))}
          </div>
          {toc.length > 1 && (
            <nav className="toc" aria-labelledby="toc-heading">
              <h2 id="toc-heading">On this page</h2>
              <ol>
                {toc.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeSlug,
              [rehypeShikiFromHighlighter, highlighter, shikiOptions],
            ]}
            components={{
              // The copy button is rendered server-side, inside React's tree. An
              // earlier version injected it with JS after parse; hydration then
              // reconciled the <pre> and stripped the button back out again.
              pre: ({ children, ...props }) => (
                <pre {...props}>
                  {children}
                  <button type="button" className="copy-btn" aria-label="Copy code to clipboard">
                    copy
                  </button>
                </pre>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>
        {related.length > 0 && (
          <aside className="related" aria-labelledby="related-heading">
            <h2 id="related-heading">Related</h2>
            <ul>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/posts/${r.slug}/`}>{r.title}</Link>
                  <span className="related-meta">{r.readingTime} min</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {(prev || next) && (
          <nav className="post-nav" aria-label="More posts">
            {prev ? (
              <Link className="post-nav-prev" href={`/posts/${prev.slug}/`}>
                <span className="post-nav-dir">← older</span>
                <span className="post-nav-title">{prev.title}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link className="post-nav-next" href={`/posts/${next.slug}/`}>
                <span className="post-nav-dir">newer →</span>
                <span className="post-nav-title">{next.title}</span>
              </Link>
            ) : <span />}
          </nav>
        )}

        <p className="article-foot">
          <Link className="back" href="/blog/">← back to blog</Link>
        </p>
        {/*
          One delegated listener on document, rather than a listener per button:
          it survives any DOM reconciliation and costs nothing per code block.
          Still a plain script and not a client component — this site ships zero
          'use client', and a React island for one button would put hydration on
          every post.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".copy-btn"); if(!b) return;
  var pre=b.parentElement, code=pre.querySelector("code")||pre;
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
      <Footer />
    </>
  );
}
