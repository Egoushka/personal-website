import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import NowFeed from "@/components/NowFeed";
import Link from "next/link";
import { getNow } from "@/lib/now";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

const description =
  "What I shipped in the last thirty days, read from public signals at build time: merged pull requests and releases in my public repositories, NuGet versions and posts. Each row is dated and links to its source.";

export const metadata: Metadata = pageMetadata({ title: "Now", description, path: "/now/" });

/**
 * The feed is built, not written: lib/now.ts counts it from GitHub, NuGet and
 * content/posts. The deploy rebuilds it daily (deploy.yml), so the page prints
 * the date it was read instead of claiming to be live.
 */
export default function NowPage() {
  const now = getNow();
  const figures = [
    now.mergedPrs > 0 && `${now.mergedPrs} merged PRs`,
    now.counts.release > 0 && `${now.counts.release} ${now.counts.release === 1 ? "release" : "releases"}`,
    now.counts.nuget > 0 && `${now.counts.nuget} NuGet packages updated`,
    now.counts.post > 0 && `${now.counts.post} ${now.counts.post === 1 ? "post" : "posts"}`,
  ].filter(Boolean) as string[];

  return (
    <Shell>
      <PageHead
        title="Now"
        lede={
          <>
            What I shipped since {formatDate(now.since)}, counted from public sources rather than written by hand.
            Public repositories only; every row links to where it happened. What the server measures lives on{" "}
            <Link prefetch={false} href="/lab/" className="text-brand-text underline underline-offset-4">Lab</Link>.
          </>
        }
        figures={
          figures.length > 0 ? (
            <>
              {figures.map((f) => (
                <span key={f}>{f}</span>
              ))}
              {now.generated && <span>read {formatDate(now.generated.slice(0, 10))}</span>}
            </>
          ) : undefined
        }
      />
      <div className="max-w-3xl">
        {now.items.length > 0 ? (
          <NowFeed items={now.items} />
        ) : (
          <p className="text-muted-foreground">
            No source answered when this page was built, so it shows nothing instead of guessing. The work is at{" "}
            <a href={site.github} rel="noopener" className="text-brand-text underline underline-offset-4">
              github.com/Egoushka
            </a>
            .
          </p>
        )}
      </div>
    </Shell>
  );
}
