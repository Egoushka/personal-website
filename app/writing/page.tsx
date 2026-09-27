import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostFilter, { type PostRow } from "@/components/PostFilter";
import { pageMetadata } from "@/lib/metadata";
import { getAllPosts, getTopicCounts, formatDate } from "@/lib/posts";
import { getReadings, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

const description =
  "Notes on backend engineering, debugging, and running a homelab on one box — by Yehor Hrabovskyi.";

export const metadata: Metadata = pageMetadata({ title: "Writing", description, path: "/writing/" });

/** `2026-07-28` → `July 2026`. The running head, one step coarser than the date. */
function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function WritingIndex() {
  const r = getReadings();

  /*
    Grouped by month: the finest grouping that still varies on a blog this
    size. The order is the reader's to choose, so the running head follows the
    sort. Formatting happens here because PostFilter is a client component and
    lib/posts.ts reads the filesystem.
  */
  const rows: PostRow[] = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    dateLabel: formatDate(p.date),
    month: formatMonth(p.date),
    readingTime: p.readingTime,
    wordCount: p.wordCount,
    topics: p.topics,
  }));

  // Chips only for topics with at least two posts: one post is a link, not a filter.
  const topics = getTopicCounts().filter(({ count }) => count >= 2).map(({ topic, count }) => ({
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
            <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>{" "}
            <span>{n(r.words)} words</span>{" "}
            {r.latest && <span>latest {formatDate(r.latest.date)}</span>}{" "}
            <span><a href="/feed.xml">rss</a></span>
          </>
        }
      />

      <PostFilter posts={rows} topics={topics} />

    </Shell>
  );
}
