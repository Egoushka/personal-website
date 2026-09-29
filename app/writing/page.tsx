import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostFilter, { type PostRow } from "@/components/PostFilter";
import { pageMetadata } from "@/lib/metadata";
import { getAllPosts, getNotes, getTopicCounts, formatDate } from "@/lib/posts";
import { projects } from "@/lib/site";
import { getReadings, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

const description =
  "Notes on backend engineering, debugging, and running a homelab on one box — by Yehor Hrabovskyi.";

export const metadata: Metadata = pageMetadata({ title: "Writing", description, path: "/writing/" });

/** A post's project as its row needs it: the slug for the link and the chip, the name to print. */
function projectOf(slug: string | undefined): PostRow["project"] {
  const project = projects.find((p) => p.slug === slug);
  return project && { slug: project.slug, name: project.name };
}

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
    cyrillic: p.cyrillic,
    description: p.description,
    kind: p.kind,
    date: p.date,
    dateLabel: formatDate(p.date),
    month: formatMonth(p.date),
    readingTime: p.readingTime,
    wordCount: p.wordCount,
    topics: p.topics,
    project: projectOf(p.project),
  }));

  // Chips only for topics with at least two posts: one post is a link, not a filter.
  const topics = getTopicCounts().filter(({ count }) => count >= 2).map(({ topic, count }) => ({
    slug: topic,
    name: topicName(topic),
    count,
  }));

  // The same rule for projects, in the order lib/site.ts lists them. A project
  // with one post has it linked on its row and on its page already.
  const projectChips = projects
    .map((p) => ({ slug: p.slug, name: p.name, count: rows.filter((r) => r.project?.slug === p.slug).length }))
    .filter(({ count }) => count >= 2);

  // The notes are posts, listed here with the rest; /notes/ has them alone.
  // Linked once there is one: "0 notes" is true and reads as a shortfall.
  const notes = getNotes().length;

  return (
    <Shell current="writing">

      <PageHead
        title="Writing"
        lede="Notes on backend engineering, debugging, and running a homelab on one box, and mostly about the parts that went wrong."
        figures={
          <>
            <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>{" "}
            <span>{n(r.words)} words</span>{" "}
            {r.latest && <span>latest {formatDate(r.latest.date)}</span>}{" "}
            {notes > 0 && (
              <>
                <span>
                  <Link className="link" prefetch={false} href="/notes/">
                    {notes} {notes === 1 ? "note" : "notes"}
                  </Link>
                </span>{" "}
              </>
            )}
            <span><a className="link" href="/feed.xml">RSS</a></span>
          </>
        }
      />

      <PostFilter posts={rows} topics={topics} projects={projectChips} />

    </Shell>
  );
}
