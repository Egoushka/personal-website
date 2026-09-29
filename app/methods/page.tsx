import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import { projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/posts";
import { getAllMethods } from "@/lib/methods";

const description =
  "The rules I follow the same way in two or more projects: where each one came from, what it costs, and when I break it.";

export const metadata: Metadata = pageMetadata({ title: "How I work", description, path: "/methods/" });

/**
 * How I work, one method at a time (ADR 0008). A method is listed once two or
 * more projects follow it, so the page is assembled from what the projects did
 * rather than written as a creed. The method more projects follow comes first.
 */
export default function MethodsIndex() {
  const methods = getAllMethods();
  const followed = new Set(methods.flatMap((m) => m.projects));
  const reviewed = methods.map((m) => m.lastReviewed).sort().at(-1);

  return (
    <Shell>
      <PageHead
        title="How I work"
        lede="Rules I follow the same way in two or more projects. Each one says where it came from, what it costs and when I break it. A lesson from one project is a post, not a rule."
        figures={
          <>
            <span>{methods.length} {methods.length === 1 ? "method" : "methods"}</span>{" "}
            <span>{followed.size} {followed.size === 1 ? "project" : "projects"}</span>{" "}
            {reviewed && <span>last reviewed {formatDate(reviewed)}</span>}
          </>
        }
      />

      <ol className="divide-y border-t">
        {methods.map((m) => (
          <li key={m.slug} className="group relative py-6">
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              <Link
                prefetch={false}
                href={`/methods/${m.slug}/`}
                className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4"
              >
                {m.title}
              </Link>
            </h2>
            <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-relaxed text-muted-foreground">{m.description}</p>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Followed in</span>
              {m.projects.flatMap((slug) => projects.filter((p) => p.slug === slug)).map((p) => (
                <Link
                  key={p.slug}
                  prefetch={false}
                  href={`/projects/${p.slug}/`}
                  className="relative z-10 inline-flex min-h-6 items-center rounded-md border px-2 font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {p.name}
                </Link>
              ))}
            </p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
