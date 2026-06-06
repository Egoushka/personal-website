import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getAllSlugs, getPost, formatDate } from "@/lib/posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post.title, description: post.description };
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const post = getPost(slug);
  return (
    <>
      <Nav />
      <main className="wrap article">
        <Link className="back" href="/blog/">← back to blog</Link>
        <h1>{post.title}</h1>
        <div className="post-meta">
          {formatDate(post.date)}
          {post.tags.length > 0 && ` · ${post.tags.join(" · ")}`}
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content}
        </ReactMarkdown>
        <p style={{ marginTop: 36 }}>
          <Link className="back" href="/blog/">← back to blog</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
