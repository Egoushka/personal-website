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

  // Up to five sibling tags turn a dead-end filter into a way around the
  // archive without needing a /tags/ index page.
  const siblings = getTagCounts().filter((t) => t.tag !== tag).slice(0, 5);

  return (
    <main id="main" className="wrap">
      <Nav current="blog" />

      {/*
        The prose column has no heading at all. The h1 is the tag name, in the
        rail, at rail size — that is where tags live everywhere else on this
        site, and "which tag am I looking at" is a fact about the page rather
        than something to read. A 12px h1 is still the document's first heading
        and still announced as level 1; <title> carries the long form.
      */}
      <div className="rail">
        <span className="rail--label">Tag</span>
        <h1 className="rail--tag">{tagLabel(tag)}</h1>
        <span>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>

        <nav className="tag-siblings" aria-label="Other tags">
          <span className="rail--label">More tags</span>
          {siblings.map(({ tag: t }) => (
            <Link key={t} href={`/tags/${t}/`}>{tagLabel(t)}</Link>
          ))}
          <Link className="tag-all" href="/blog/">all posts →</Link>
        </nav>
      </div>

      <PostList posts={posts} />

      <Footer />
    </main>
  );
}
