import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

/** Shared post list — used by /blog/ and every /tags/<tag>/ page. */
export default function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <div className="post-list">
      {posts.map((p) => (
        <Link className="post-row" href={`/posts/${p.slug}/`} key={p.slug}>
          <div>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
          </div>
          <span className="date">
            <time dateTime={p.date}>{formatDate(p.date)}</time>
            {` · ${p.readingTime} min`}
          </span>
        </Link>
      ))}
    </div>
  );
}
