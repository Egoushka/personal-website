import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

/**
 * Shared post row — used by /blog/, /tags/<tag>/ and the home page.
 *
 * The date sits inline under the excerpt rather than in the rail, because on
 * both index pages the rail is already carrying something (the year, or the
 * tag). One rail per page, one thing in it.
 */
export default function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <ol className="post-list">
      {posts.map((p) => (
        <li className="post-row" key={p.slug}>
          <Link href={`/posts/${p.slug}/`}>{p.title}</Link>
          <p>{p.description}</p>
          <span className="post-meta">
            <time dateTime={p.date}>{formatDate(p.date)}</time>
            {` · ${p.readingTime} min`}
          </span>
        </li>
      ))}
    </ol>
  );
}
