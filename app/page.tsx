import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PostList from "@/components/PostList";
import { PersonAndSiteLd } from "@/components/JsonLd";
import Panel from "@/components/Panel";
import ProjectCard, { type ProjectCardData } from "@/components/ProjectCard";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Mail } from "@/components/ui/icons";
import { site, proof, projects, type Project } from "@/lib/site";
import { getDocPages } from "@/lib/docs";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getAllPosts, type PostMeta } from "@/lib/posts";
import { getReadings, getTopicUsage, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

export const metadata: Metadata = pageMetadata({
  title: { absolute: `${site.name} — ${site.role}` },
  description: site.description,
  path: "/",
});

/**
 * The home page.
 *
 * One job: a stranger who has never heard of me should know who I am and be one
 * click from the writing inside about eight seconds. That is the whole brief.
 * Every counted figure below comes from lib/readings.ts or a post's
 * frontmatter at build; the ones that cannot be counted name their source in
 * lib/site.ts. See ADR 0002.
 */
function card(p: Project, posts: PostMeta[]): ProjectCardData {
  return {
    slug: p.slug,
    name: p.name,
    lang: p.lang,
    shape: p.shape,
    status: p.status,
    summary: p.summary,
    repo: p.visibility === "public" && p.href ? p.href : undefined,
    docs: getDocPages(p.slug)[0]?.href,
    posts: posts.filter((post) => post.project === p.slug).length,
  };
}

/** A section's title and the link to everything in it, on one line. */
function SectionHead({ id, title, href, more }: { id: string; title: string; href?: string; more?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      {href && more && (
        <Link
          prefetch={false}
          href={href}
          className="inline-flex min-h-6 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {more} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

/** The post a proof entry cites, with the span it is about. Fails the build rather than print a blank. */
function spanOf(posts: PostMeta[], slug: string): PostMeta & { spanDays: number } {
  const post = posts.find((p) => p.slug === slug);
  if (!post?.spanDays) throw new Error(`proof: post "${slug}" is not published or has no spanDays`);
  return post as PostMeta & { spanDays: number };
}

export default function Home() {
  const r = getReadings();
  const posts = getAllPosts();
  /*
    Every topic anything references, not just the ones posts use: a section
    headed "things I keep coming back to" should not be silent about the ones I
    am paid to come back to, and a topic page nothing links to is orphaned.
  */
  const topics = getTopicUsage();
  /*
    The heading says "still running", so the list is filtered to running: what
    a stranger can install, plus the side projects marked `featured`. The split
    below is `Project.side`, not array position, so adding a project cannot
    silently promote it — the installable one sits above the ones only I run,
    because listing them as equals averages the first down to the second.
  */
  const listed = projects.filter((p) => p.status === "running" && (!p.side || p.featured));
  const shipped = listed.filter((p) => !p.side);
  const side = listed.filter((p) => p.side);

  return (
    <Shell current="home">
      <PersonAndSiteLd />

      {/*
        The sentence is the h1, not the greeting. The line above it carries a
        name's worth of context: where I am and whether I am available. The
        address is the button's own text, so a desktop with no mail handler
        still shows something to copy.
      */}
      <header className="pt-14 pb-12 md:pt-20 md:pb-16">
        <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          <span className="live-dot" aria-hidden="true" />
          {site.location} · {site.availability}
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
          {site.intro}
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground text-pretty">{site.description}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a className={buttonVariants({ size: "lg" })} href={`mailto:${site.email}`}>
            <Mail /> {site.email}
          </a>
          <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/writing/">
            Read the writing <ArrowRight />
          </Link>
        </div>
      </header>

      {/* Three things a stranger can check in under a minute. */}
      <ul className="grid gap-4 md:grid-cols-3">
        {proof.map((p) => {
          const post = p.post ? spanOf(posts, p.post) : undefined;
          return (
            <li key={p.post ?? p.label} className="flex flex-col rounded-xl border bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">{post ? `${n(post.spanDays)} days` : p.label}</p>
              <p className="mt-2 leading-relaxed">{p.text}</p>
              {(p.links.length > 0 || post) && (
                <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm">
                  {p.links.map((l) => (
                    <a className="link inline-flex min-h-6 items-center" key={l.href} href={l.href} rel="noopener">
                      {l.label}
                    </a>
                  ))}
                  {post && (
                    <Link className="link inline-flex min-h-6 items-center" prefetch={false} href={`/writing/${post.slug}/`}>
                      read it
                    </Link>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Live figures, below the claims a stranger can check without them. */}
      <div className="mt-4">
        <Panel />
      </div>

      <section className="mt-24" aria-labelledby="home-writing">
        <SectionHead id="home-writing" title="Things I've written down" href="/writing/" more="All posts" />
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          {r.posts} {r.posts === 1 ? "post" : "posts"} · {n(r.words)} words
          {r.latest && <> · latest {formatDate(r.latest.date)}</>}
        </p>
        <PostList posts={posts.slice(0, 5)} className="mt-8" />
      </section>

      <section className="mt-24" aria-labelledby="home-projects">
        <SectionHead id="home-projects" title="Built, and still running" href="/projects/" more={`All ${r.projects} projects`} />
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          {r.projects} projects · {r.projectsRunning} still running
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {shipped.map((p) => (
            <ProjectCard key={p.slug} p={card(p, posts)} />
          ))}
        </ul>
        {side.length > 0 && (
          <>
            <h3 className="mt-10 text-sm font-medium text-muted-foreground">Side projects</h3>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {side.map((p) => (
                <ProjectCard key={p.slug} p={card(p, posts)} />
              ))}
            </ul>
          </>
        )}
      </section>

      {topics.length > 0 && (
        <section className="mt-24" aria-labelledby="home-topics">
          <SectionHead id="home-topics" title="Things I keep coming back to" />
          <p className="mt-2 text-sm text-muted-foreground">One vocabulary, across posts, projects and jobs.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link
                  prefetch={false}
                  href={`/topics/${t.slug}/`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors hover:border-input hover:bg-accent"
                >
                  {topicName(t.slug)}
                  {/* A count of 1 is not a count, it is a label repeating itself. */}
                  {t.total > 1 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t.total}
                      <span className="visually-hidden"> items</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Counted, and the site admitting something: the number makes the joke. */}
      <p className="mt-24 font-mono text-xs text-muted-foreground">
        {n(r.codeLines + r.cssLines)} lines of code and CSS for {n(r.words)} words, counted at build,{" "}
        <time dateTime={r.builtOn}>{formatDate(r.builtOn)}</time>.
      </p>
    </Shell>
  );
}
