import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";
import Lang from "@/components/Lang";
import KindLabel from "@/components/KindLabel";
import { cn } from "@/lib/utils";

/**
 * The post row, shared by the home page, /notes/, a project's page and a
 * topic page: date, title, the one-line description, reading time, and "Note"
 * on a note. The whole row is the link's target; the title is the only link in it.
 */
export default function PostList({
  posts,
  dates = true,
  kinds = true,
  className,
}: {
  posts: PostMeta[];
  /** The date column. Off where a list is already grouped by month. */
  dates?: boolean;
  /** A note's label. Off where every row is a note. */
  kinds?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("post-list divide-y", className)}>
      {posts.map((p) => (
        <li className="post-row group relative py-5 first:pt-0 last:pb-0" key={p.slug}>
          <div className={cn("flex flex-col gap-1.5", dates && "sm:flex-row sm:gap-8")}>
            {dates && (
              <time dateTime={p.date} className="shrink-0 pt-0.5 text-sm text-muted-foreground tabular-nums sm:w-36">
                {formatDate(p.date)}
              </time>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-balance">
                <Link
                  prefetch={false}
                  href={`/writing/${p.slug}/`}
                  className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4"
                >
                  <Lang text={p.title} lang={p.cyrillic} />
                </Link>
              </h3>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{p.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {kinds && <KindLabel kind={p.kind} />}{" "}
                {!dates && (
                  <>
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    <span aria-hidden="true"> · </span>
                  </>
                )}
                {p.readingTime} min read
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
