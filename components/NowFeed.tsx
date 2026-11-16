import Link from "next/link";
import { formatDate } from "@/lib/posts";
import type { NowItem } from "@/lib/now";

const KIND: Record<NowItem["kind"], string> = {
  merged: "Merged PR",
  release: "Release",
  nuget: "NuGet",
  post: "Post",
};

/** Items arrive newest first; a run of the same date is one group. */
function byDay(items: NowItem[]): { date: string; items: NowItem[] }[] {
  const days: { date: string; items: NowItem[] }[] = [];
  for (const i of items) {
    const last = days.at(-1);
    if (last?.date === i.date) last.items.push(i);
    else days.push({ date: i.date, items: [i] });
  }
  return days;
}

/**
 * Rows grouped under their date. Each title is the only link in its row and
 * carries a `data-umami-event`, so a click through to a post or a repo is
 * counted without script (the tracker reads the attribute).
 */
export default function NowFeed({ items }: { items: NowItem[] }) {
  return (
    <div className="divide-y">
      {byDay(items).map((d) => (
        <section className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 sm:flex-row sm:gap-8" key={d.date}>
          <h2 className="shrink-0 pt-0.5 text-sm font-normal text-muted-foreground tabular-nums sm:w-36">
            <time dateTime={d.date}>{formatDate(d.date)}</time>
          </h2>
          <ul className="min-w-0 flex-1 space-y-3">
            {d.items.map((i) => {
              const umami = { "data-umami-event": "now-click", "data-umami-event-kind": i.kind, "data-umami-event-target": i.href };
              const cls = "after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4";
              return (
                <li className="group relative" key={`${i.kind}:${i.href}`}>
                  <p className="text-base font-semibold tracking-tight text-balance">
                    {i.kind === "post" ? (
                      <Link prefetch={false} href={i.href} className={cls} {...umami}>{i.title}</Link>
                    ) : (
                      <a href={i.href} rel="noopener" className={cls} {...umami}>{i.title}</a>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {KIND[i.kind]}
                    {i.kind === "merged" || i.kind === "release" ? <> · {i.repo}</> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
