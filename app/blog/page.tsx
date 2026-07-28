import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site, feedTypes } from "@/lib/site";
import PostList from "@/components/PostList";
import { getAllPosts, getTagCounts } from "@/lib/posts";
import { tagLabel } from "@/lib/tags";

const description =
  "Notes on backend engineering, debugging, and running a homelab — by Yehor Hrabovskyi.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: "/blog/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Blog — ${site.name}`,
    description,
    url: `${site.url}/blog/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Blog — ${site.name}`, description },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <>
      <Nav current="blog" />
      <main id="main">
        <section className="page-head" aria-labelledby="blog-heading">
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> ls ./blog</div>
            <h1 id="blog-heading">Writing</h1>
            <p className="section-intro">
              Debug stories, backend notes, and homelab logs. Mostly the things
              I&apos;d want to have read before I learned them the hard way.
            </p>
            <div className="tag-chips">
              {getTagCounts().map(({ tag, count }) => (
                <Link className="tag-chip" href={`/tags/${tag}/`} key={tag}>
                  {tagLabel(tag)} <span className="tag-count">{count}</span>
                </Link>
              ))}
            </div>
            <PostList posts={posts} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
