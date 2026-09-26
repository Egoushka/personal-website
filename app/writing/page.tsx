import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostFilter, { type PostRow } from "@/components/PostFilter";
import { site, feedTypes } from "@/lib/site";
import { getAllPosts, getTopicCounts, formatDate } from "@/lib/posts";
import { getReadings, n, latestPhrase } from "@/lib/readings";
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

/** `2026-07-28` → `July 2026`. The running head, one step coarser than the date. */
function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function WritingIndex() {
  const r = getReadings();

  /*
    The index used to group by year, with the year set large in the rail. Every
    post on this site was published in one year, so the grouping drew a heading
    the width of the page around *all* of them and told the reader nothing. The
    month is the finest grouping that still varies, and the order is now the
    reader's to choose — so the running head follows the sort rather than being
    a fact the page insists on.

    Formatting happens here because PostFilter is a client component and
    lib/posts.ts reads the filesystem.
  */
  const rows: PostRow[] = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    dateLabel: formatDate(p.date),
    month: formatMonth(p.date),
    readingTime: p.readingTime,
    wordCount: p.wordCount,
    topics: p.topics,
  }));

  const topics = getTopicCounts().map(({ topic, count }) => ({
    slug: topic,
    name: topicName(topic),
    count,
  }));

  return (
    <Shell current="writing">

      <PageHead
        title="Writing"
        quiet
        figures={
          <>
            <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>
            <span>{n(r.words)} words</span>
            {r.latest && <span>{latestPhrase(r.daysSinceLatest)}</span>}
            <span><a href="/feed.xml">rss</a></span>
          </>
        }
      />

      <PostFilter posts={rows} topics={topics} />

    </Shell>
  );
}
