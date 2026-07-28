import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import Nav from "@/components/Nav";
import { BlogPostingLd } from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { site, feedTypes } from "@/lib/site";
import { getAllSlugs, getPost, formatDate, tableOfContents } from "@/lib/posts";

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
            {post.tags.length > 0 && ` · ${post.tags.join(" · ")}`}
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </article>
        <p className="article-foot">
          <Link className="back" href="/blog/">← back to blog</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
