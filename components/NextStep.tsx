import Link from "next/link";
import Lang from "@/components/Lang";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { formatDate, type PostMeta } from "@/lib/posts";
import type { NextStep as Step } from "@/lib/next-step";

const CARD =
  "group relative flex items-center gap-4 rounded-xl border p-5 transition-colors hover:border-input hover:bg-accent/40";
const STRETCH = "after:absolute after:inset-0 after:rounded-xl";

/**
 * The end of a post: one post to read and one thing to try. Each link carries a
 * `data-umami-event`, so a click is counted without script (the tracker reads
 * the attribute). `from` is the page that showed it; `event` is `next` at the
 * end of a post and `home` on the home page, giving next-read, next-try,
 * home-read and home-try.
 */
export default function NextStep(
  { step, from, event = "next", heading = "Next" }: { step: Step; from: string; event?: "next" | "home"; heading?: string },
) {
  const { read, tryIt } = step;
  if (!read && !tryIt) return null;
  return (
    <section className="mt-14" aria-labelledby={`${event}-step`} data-pagefind-ignore>
      <h2 id={`${event}-step`} className="text-sm font-medium text-muted-foreground">
        {heading}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {read && <ReadCard post={read} from={from} event={event} />}
        {tryIt && (
          <div className={CARD}>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight">
                {tryIt.external ? (
                  <a
                    href={tryIt.href}
                    className={STRETCH}
                    data-umami-event={`${event}-try`}
                    data-umami-event-from={from}
                    data-umami-event-target={tryIt.href}
                  >
                    {tryIt.label}
                  </a>
                ) : (
                  <Link
                    prefetch={false}
                    href={tryIt.href}
                    className={STRETCH}
                    data-umami-event={`${event}-try`}
                    data-umami-event-from={from}
                    data-umami-event-target={tryIt.href}
                  >
                    {tryIt.label}
                  </Link>
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{tryIt.external ? new URL(tryIt.href).hostname : "On this site"}</p>
            </div>
            <ArrowUpRight className="ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </section>
  );
}

function ReadCard({ post, from, event }: { post: PostMeta; from: string; event: string }) {
  return (
    <div className={CARD}>
      <div className="min-w-0">
        <p className="text-lg font-semibold tracking-tight">
          <Link
            prefetch={false}
            href={`/writing/${post.slug}/`}
            className={STRETCH}
            data-umami-event={`${event}-read`}
            data-umami-event-from={from}
            data-umami-event-target={post.slug}
          >
            <Lang text={post.title} lang={post.cyrillic} />
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(post.date)} · {post.readingTime} min read
        </p>
      </div>
      <ArrowRight className="ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
