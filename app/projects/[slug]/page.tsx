import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import PostList from "@/components/PostList";
import Byline from "@/components/Byline";
import StatusBadge from "@/components/StatusBadge";
import Icon from "@/components/Icon";
import Lang from "@/components/Lang";
import { Downloads } from "@/components/Measured";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Lock } from "@/components/ui/icons";
import { site, projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { getProjectPosts } from "@/lib/posts";
import { getProjectMethods } from "@/lib/methods";
import { docSections, docVersion, getDocPages, getDocSource } from "@/lib/docs";
import { topicName } from "@/lib/topics";
import { cn } from "@/lib/utils";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    ...pageMetadata({
      title: project.name,
      description: project.summary,
      path: `/projects/${slug}/`,
      ownCard: true,
    }),
    keywords: project.topics,
  };
}

/** A figure's value, sized to fit a card: a sentence-long value steps down once, never further. */
function valueSize(value: string) {
  return value.length <= 24 ? "text-2xl" : "text-xl leading-snug";
}

/** One row of the facts card. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}

/**
 * One project, and everything written about it.
 *
 * What it is and where to go first (the docs, the code, the write-up), then what
 * it is measured at — every reading names where its figure came from, because a
 * number with no provenance is the exact failure this site is built to avoid —
 * then the full account, the docs page by page, the posts about it, and the
 * methods it follows.
 */
export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const posts = getProjectPosts(project.slug, project.writeup);
  // The methods that name this project, from their own frontmatter (ADR 0008).
  const methods = getProjectMethods(project.slug);
  // Written in the tool's repository and copied here at a commit (ADR 0006).
  const docSource = getDocSource(project.slug);
  const docs = getDocPages(project.slug);
  const writeup = project.writeup && posts.some((p) => p.slug === project.writeup) ? project.writeup : undefined;
  const repoLabel = project.href.replace(/^https:\/\/(www\.)?/, "");

  return (
    <Shell current="projects">
      <Breadcrumb className="pt-8 md:pt-10" data-pagefind-ignore>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects/">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* What it is, and where to go first. */}
      <section className="grid gap-10 pt-6 pb-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div data-pagefind-body>
          <div className="flex flex-wrap items-center gap-2" data-pagefind-ignore>
            <StatusBadge status={project.status} />
            <Badge variant="outline">{project.lang}</Badge>
            <Badge variant="outline">{project.shape}</Badge>
            {project.visibility === "private" && (
              <Badge variant="muted">
                <Lock /> Private repository
              </Badge>
            )}
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{project.name}</h1>
          <p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground text-pretty">{project.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3" data-pagefind-ignore>
            {docs.length > 0 && (
              <Link prefetch={false} href={docs[0].href} className={buttonVariants({ size: "lg" })}>
                <BookOpen /> Read the docs
              </Link>
            )}
            {project.href && (
              <a href={project.href} rel="noopener" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <Icon name="github" size={16} /> Source on GitHub <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </a>
            )}
            {writeup && (
              <Link
                prefetch={false}
                href={`/writing/${writeup}/`}
                className={buttonVariants({ variant: docs.length || project.href ? "ghost" : "default", size: "lg" })}
              >
                <FileText /> Read the write-up
              </Link>
            )}
          </div>
        </div>

        <Card className="gap-0 self-start py-0" data-pagefind-ignore>
          <p className="border-b px-5 py-3.5 text-sm font-semibold">At a glance</p>
          <dl className="divide-y text-sm">
            <Fact label="Source">
              {project.href ? (
                <a className="link inline-flex items-center gap-1 break-all" href={project.href} rel="noopener">
                  {repoLabel}
                </a>
              ) : (
                <span className="text-muted-foreground">private</span>
              )}
            </Fact>
            {docSource && docs.length > 0 && (
              <Fact label="Docs">
                <Link className="link" prefetch={false} href={docs[0].href}>
                  {docs.length} pages
                </Link>{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">{docVersion(docSource)}</span>
              </Fact>
            )}
            {writeup && (
              <Fact label="Write-up">
                <Link className="link" prefetch={false} href={`/writing/${writeup}/`}>
                  {posts.find((p) => p.slug === writeup)?.readingTime} min read
                </Link>
              </Fact>
            )}
            {posts.length > 0 && (
              <Fact label="Writing">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </Fact>
            )}
            <Fact label="Status">
              <span className="capitalize">{project.status}</span>
            </Fact>
          </dl>
          {project.topics.length > 0 && (
            <div className="border-t px-5 py-4">
              <p className="text-sm text-muted-foreground">Topics</p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {project.topics.map((t) => (
                  <li key={t}>
                    <Link
                      prefetch={false}
                      href={`/topics/${t}/`}
                      className={cn(badgeVariants({ variant: "secondary" }), "min-h-6 transition-colors hover:bg-accent")}
                    >
                      {topicName(t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* Measured, each with its source. */}
      {project.readings.length > 0 && (
        <section className="border-t py-12" aria-labelledby="readings" data-pagefind-body>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="readings" className="text-2xl font-semibold tracking-tight">
              By the numbers
            </h2>
            <p className="text-sm text-muted-foreground" data-pagefind-ignore>
              Every figure names where it came from.
            </p>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.readings.map((r) => (
              <li key={r.label} className="flex flex-col rounded-xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">{r.label}</p>
                <p className={cn("mt-2 font-semibold tracking-tight tabular-nums text-balance wrap-anywhere", valueSize(r.value))}>{r.value}</p>
                <p className="mt-auto pt-3 text-xs leading-relaxed text-muted-foreground">{r.source}</p>
              </li>
            ))}
            {/* Counted by NuGet rather than by me, which is the point of it.
                Absent until the box publishes it. */}
            {project.slug === "attest" && <Downloads />}
          </ul>
        </section>
      )}

      <div className="grid gap-12 border-t py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="about" data-pagefind-body>
            <h2 id="about" className="text-2xl font-semibold tracking-tight">
              What it is
            </h2>
            <p className="mt-4 max-w-3xl text-[1.0625rem] leading-8 text-foreground/90">
              <Lang text={project.description} lang={project.cyrillic} />
            </p>
            {/*
              The phase line is only printed when the project declares stages,
              and it names what does not exist yet: the half a reader cannot
              check, and what makes the rest believable.
            */}
            {project.phase && (
              <div className="mt-8 max-w-3xl rounded-xl border bg-muted/50 p-5">
                <p className="text-sm font-semibold">Where it stands</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{project.phase}</p>
              </div>
            )}
          </section>

          {docSource && docs.length > 0 && (
            <section aria-labelledby="docs" data-pagefind-ignore>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="docs" className="text-2xl font-semibold tracking-tight">
                  Documentation
                </h2>
                <Link prefetch={false} href={docs[0].href} className="inline-flex min-h-6 items-center gap-1.5 text-sm font-medium hover:text-foreground/80">
                  Open the docs <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Written in the repository and copied here at <span className="font-mono">{docVersion(docSource)}</span>.
              </p>
              <div className="mt-6 space-y-6">
                {docSections(docs).map((s) => (
                  <div key={s.title}>
                    <p className="mb-2.5 text-sm font-medium text-muted-foreground">{s.title}</p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {s.pages.map((d) => (
                        <li
                          key={d.page}
                          className="group relative flex gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-input hover:bg-accent/50"
                        >
                          <div className="min-w-0">
                            <Link prefetch={false} href={d.href} className="font-medium after:absolute after:inset-0 after:rounded-xl">
                              {d.title}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                          </div>
                          <ArrowRight className="mt-1 ml-auto text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section aria-labelledby="writing" data-pagefind-ignore>
              <h2 id="writing" className="text-2xl font-semibold tracking-tight">
                Writing about it
              </h2>
              <PostList posts={posts} className="mt-6" />
            </section>
          )}

          {methods.length > 0 && (
            <section aria-labelledby="methods" data-pagefind-ignore>
              <h2 id="methods" className="text-2xl font-semibold tracking-tight">
                Methods it follows
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Rules I follow the same way in this project and at least one other.
              </p>
              <ul className="mt-6 grid gap-3">
                {methods.map((m) => (
                  <li
                    key={m.slug}
                    className="group relative flex gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-input hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <Link prefetch={false} href={`/methods/${m.slug}/`} className="font-medium after:absolute after:inset-0 after:rounded-xl">
                        {m.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    </div>
                    <ArrowRight className="mt-1 ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start" data-pagefind-ignore>
          {project.tech.length > 0 && (
            <Card className="gap-4 px-5 py-5">
              <h2 className="text-sm font-semibold">Built with</h2>
              {/* Read out of the repository rather than remembered. */}
              <ul className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <li key={t}>
                    <Badge variant="outline" className="font-normal">
                      {t}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {project.visibility === "private" && (
            <Card className="gap-2 px-5 py-5 text-sm">
              <h2 className="font-semibold">Private repository</h2>
              <p className="leading-relaxed text-muted-foreground">
                There is no code to click through for this one. Most of the rest is public on{" "}
                <a className="link" href={site.github} rel="noopener">
                  my GitHub
                </a>
                , including the two built for other people to run: Attest and chargehand.
              </p>
            </Card>
          )}

          <Card className="gap-4 px-5 py-5">
            <h2 className="text-sm font-semibold">Questions about {project.name}?</h2>
            <Byline title={project.name} />
          </Card>

          <Link
            prefetch={false}
            href="/projects/"
            className="inline-flex min-h-6 items-center gap-1.5 px-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="size-3.5 rotate-180" /> All projects
          </Link>
        </div>
      </div>
    </Shell>
  );
}
