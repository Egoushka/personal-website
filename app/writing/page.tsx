import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";
import { site, feedTypes } from "@/lib/site";
import { getAllPosts, getTopicCounts } from "@/lib/posts";
import { getReadings, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

const description =
  "Notes on backend engineering, debugging, and running a homelab on one box — by Yehor Hrabovskyi.";

export const metadata: Metadata = {
  title: "Writing",
  description,
  alternates: { canonical: "/writing/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Writing — ${site.name}`,
    description,
    url: `${site.url}/writing/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Writing — ${site.name}`, description },
};

export default function WritingIndex() {
  const r = getReadings();

  // Grouped by year, newest first. The year is a running head in the rail, not a
  // heading in the prose column — it is a fact about the group, not content.
  const byYear = new Map<string, ReturnType<typeof getAllPosts>>();
  for (const p of getAllPosts()) {
    const year = p.date.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), p]);
  }

  return (
    <main id="main" className="wrap">
      <Nav current="writing" />

      <PageHead
        title="Writing"
        figures={
          <>
            <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>
            <span>{n(r.words)} words</span>
            {r.latest && <span>latest {r.daysSinceLatest} {r.daysSinceLatest === 1 ? "day" : "days"} ago</span>}
            <span><a href="/feed.xml">rss</a></span>
          </>
        }
      />

      {/*
        Topics run under the head rather than down the rail. In the rail they land
        in column one of the row *after* the head, which opens a hole the width of
        the page between the title and the first post.
      */}
      <ul className="topic-run">
        {getTopicCounts().map(({ topic, count }) => (
          <li key={topic}>
            <Link href={`/topics/${topic}/`}>
              {topicName(topic)} <span className="rail-count">{count}</span>
            </Link>
          </li>
        ))}
      </ul>

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
