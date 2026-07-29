import type { Metadata } from "next";
import React from "react";
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
  // Grouped by year, newest first. The year is a running head in the rail, not
  // a heading in the prose column — it is a fact about the group, not content.
  const byYear = new Map<string, ReturnType<typeof getAllPosts>>();
  for (const p of getAllPosts()) {
    const year = p.date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), p]);
  }

  return (
    <main id="main" className="wrap">
      <Nav current="blog" />

      <div className="rail hero-rail">
        {getTagCounts().map(({ tag, count }) => (
          <Link key={tag} href={`/tags/${tag}/`}>
            {tagLabel(tag)} <span className="rail-count">{count}</span>
          </Link>
        ))}
      </div>
      <div className="hero">
        <h1>Writing</h1>
        <p>
          Debug stories, backend notes, and homelab logs. Mostly the things
          I&apos;d want to have read before I learned them the hard way.
        </p>
      </div>

      {[...byYear.entries()].map(([year, posts]) => (
        <React.Fragment key={year}>
          <hr className="bleed" />
          <section className="row">
            <span className="rail year-head">{year}</span>
            <PostList posts={posts} />
          </section>
        </React.Fragment>
      ))}

      <Footer />
    </main>
  );
}
