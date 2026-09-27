import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

/**
 * Shared post row — used by the home page, /writing/ and /topics/<topic>/.
 *
 * The date sits inline under the excerpt rather than in the rail, because on
 * every page that uses this the rail is already carrying something (the year,
 * the topic, the counted figures). One rail per page, one thing in it.
 */
export default function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <ol className="post-list">
      {posts.map((p) => (
        <li className="post-row" key={p.slug}>
          <Link prefetch={false} href={`/writing/${p.slug}/`}>{p.title}</Link>
          <p>{p.description}</p>
          <span className="post-meta run">
            <span><time dateTime={p.date}>{formatDate(p.date)}</time></span>{" "}
            <span>{p.readingTime} min read</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
