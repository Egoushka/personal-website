import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PostList from "@/components/PostList";
import { site, feedTypes } from "@/lib/site";
import { getPostsByTag, getTagCounts } from "@/lib/posts";
import { TAGS, isTag, tagLabel } from "@/lib/tags";

type Params = { tag: string };

// Only tags actually used by a post get a page — an empty hub is worse than a 404.
export function generateStaticParams(): Params[] {
  return getTagCounts().map(({ tag }) => ({ tag }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { tag } = await params;
  const label = tagLabel(tag);
  const description = isTag(tag)
    ? TAGS[tag].description
    : `Posts tagged ${label} by ${site.name}.`;
  const url = `${site.url}/tags/${tag}/`;
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

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();

  return (
    <>
      <Nav current="blog" />
      <main id="main">
        <section className="page-head" aria-labelledby="tag-heading">
          <div className="wrap">
            <div className="prompt">
              <span className="dollar">$</span> grep -l {tag} posts/*.md
            </div>
            <h1 id="tag-heading">{tagLabel(tag)}</h1>
            <p className="section-intro">
              {isTag(tag) ? TAGS[tag].description : null}
            </p>
            <PostList posts={posts} />
            <p className="section-outro">
              <Link href="/blog/">← all posts</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
