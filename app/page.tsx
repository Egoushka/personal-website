import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PostList from "@/components/PostList";
import { PersonAndSiteLd } from "@/components/JsonLd";
import Panel from "@/components/Panel";
import { site, proof, projects, type Project } from "@/lib/site";
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
function projectRow(p: Project) {
  return (
    <li className="project-row" key={p.slug}>
      <h3 className="project-name">
        <Link prefetch={false} href={`/projects/${p.slug}/`}>{p.name}</Link>
      </h3>
      <span className="project-status run"><span>{p.lang}</span>{" "}<span>{p.shape}</span>{" "}<span className="project-state">{p.status}</span></span>
      <p>{p.summary}</p>
    </li>
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
        name's worth of context — where I am and whether I am available. The
        address is the button's own text, so a desktop with no mail handler
        still shows something to copy.
      */}
      <header className="home-greeting">
        <p className="home-eyebrow">
          <span className="live-dot" aria-hidden="true" />
          {site.location} — {site.availability}
        </p>
        <h1>{site.intro}</h1>
        <p className="home-status">
          <a className="cta" href={`mailto:${site.email}`}>{site.email}</a>{" "}
          <Link className="cta cta--ghost" href="/writing/">Read the writing</Link>
        </p>
      </header>

      {/*
        The proof row. It deliberately does NOT use the rail-left / content-right
        rhythm every section below it uses: four screens of identical rhythm is
        what made this page scroll past unread, and the one block a cold reader
        must not scroll past is this one.
      */}
      <ul className="proof">
        {proof.map((p) => {
          const post = p.post ? spanOf(posts, p.post) : undefined;
          return (
            <li key={p.post ?? p.label}>
              <span className="proof-label">{post ? `${n(post.spanDays)} days` : p.label}</span>{" "}
              <span className="proof-text">{p.text}</span>{" "}
              {p.links.map((l) => (
                <a className="proof-link" key={l.href} href={l.href} rel="noopener">
                  {l.label}
                </a>
              ))}
              {post && (
                <Link className="proof-link" prefetch={false} href={`/writing/${post.slug}/`}>
                  read it
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Live figures, below the claims a stranger can check without them. */}
      <Panel />

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">Writing</span>
          <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>
          <span>{n(r.words)} words</span>
          {r.latest && <span>latest {formatDate(r.latest.date)}</span>}
        </span>
        <div>
          <div className="section-head">
            <h2>Things I&apos;ve written down</h2>
            <Link prefetch={false} href="/writing/">all posts</Link>
          </div>
          <PostList posts={posts.slice(0, 5)} />
        </div>
      </section>

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">Projects</span>
          <span>{r.projects} of them</span>
          <span>{r.projectsRunning} still running</span>
        </span>
        <div>
          <div className="section-head">
            <h2>Built, and still running</h2>
            <Link prefetch={false} href="/projects/">all {r.projects} projects</Link>
          </div>
          <ol className="project-list">{shipped.map(projectRow)}</ol>
          {side.length > 0 && (
            <>
              <span className="project-sublabel">Side projects</span>
              <ol className="project-list">{side.map(projectRow)}</ol>
            </>
          )}
        </div>
      </section>

      {topics.length > 0 && (
        <>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--against-body">
              <span className="rail--label">Topics</span>
              <span>{topics.length} of them</span>
              <span>one vocabulary, across posts, projects and jobs</span>
            </span>
            <div>
              <div className="section-head">
                <h2>Things I keep coming back to</h2>
              </div>
              <ul className="topic-run">
                {topics.map((t) => (
                  <li key={t.slug}>
                    <Link prefetch={false} href={`/topics/${t.slug}/`}>
                      {topicName(t.slug)}
                      {/* A count of 1 is not a count, it is a label repeating
                          itself. The row stays: hiding every topic backed by
                          one thing would hide most of what this site is for. */}
                      {t.total > 1 && <>{" "}<span className="rail-count">{t.total}<span className="visually-hidden"> items</span></span></>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Counted, and the site admitting something: the number makes the joke. */}
      <p className="home-note">
        {n(r.codeLines + r.cssLines)} lines of code and CSS for {n(r.words)}{" "}
        words, counted at build, <time dateTime={r.builtOn}>{formatDate(r.builtOn)}</time>.
      </p>

    </Shell>
  );
}
