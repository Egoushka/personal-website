import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PostList from "@/components/PostList";
import { PersonAndSiteLd } from "@/components/JsonLd";
import Panel from "@/components/Panel";
import { site, proof, projects, type Project } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";
import { getReadings, getTopicUsage, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";

/**
 * The home page.
 *
 * One job: a stranger who has never heard of me should know who I am and be one
 * click from the writing inside about eight seconds. That is the whole brief.
 *
 * This replaced a double-entry trial balance — eight numbered claims about the
 * owner, each set against a counted figure, behind collapsed disclosures. It was
 * the most specific idea this site ever had and it was hostile: a reader had to
 * learn bookkeeping before extracting one fact, five of the eight claims were
 * about the site itself, and the CV was one word in a metadata line. What
 * survived is the rule underneath it — every figure below is counted at build
 * time, never typed. See ADR 0002.
 */
function projectRow(p: Project) {
  return (
    <li className="project-row" key={p.slug}>
      <h3 className="project-name">
        <Link href={`/projects/${p.slug}/`}>{p.name}</Link>
      </h3>
      <span className="project-status run"><span>{p.lang}</span><span>{p.shape}</span><span>{p.status}</span></span>
      <p>{p.summary}</p>
    </li>
  );
}

export default function Home() {
  const r = getReadings();
  const posts = getAllPosts();
  /*
    Every topic anything references, not just the ones posts use. Counting only
    post topics listed four of thirteen and left six topic pages reachable from
    nowhere but each other — orphaned from the whole site while sitting in the
    sitemap. A section headed "things I keep coming back to" should also not be
    silent about the ones I am paid to come back to.
  */
  const topics = getTopicUsage();
  const shipped = projects.filter((p) => !p.side);
  const side = projects.filter((p) => p.side);

  return (
    <main id="main" className="wrap">
      <Nav current="home" />
      <PersonAndSiteLd />

      {/*
        The sentence is the h1 now, not the greeting.

        "Hey — I'm Yehor" was the largest thing on the page and it told a
        stranger nothing; the line that says what I do was set below it at body
        size. They have swapped. The greeting survives as the line above, where
        a name belongs, next to the two facts a cold reader needs — where I am
        and whether I am available.
      */}
      <header className="home-greeting">
        <p className="home-eyebrow">
          <span className="live-dot" aria-hidden="true" />
          {site.location} — {site.availability}
        </p>
        <h1>{site.intro}</h1>
        <p className="home-status">
          <a className="cta" href={`mailto:${site.email}`}>Email me</a>
          <Link className="cta cta--ghost" href="/writing/">Read the writing</Link>
        </p>
      </header>

      {/* Live, and absent when the box is not publishing. */}
      <Panel />

      {/*
        The proof row. It deliberately does NOT use the rail-left / content-right
        rhythm every section below it uses: four screens of identical rhythm is
        what made this page scroll past unread, and the one block a cold reader
        must not scroll past is this one.

        The third row is assembled here rather than stored in lib/site.ts with
        the other two, because both its figure and its link come from the post
        index — writing "51" into the data file would be typing a number the
        build already knows. No post with a `spanDays`, no third row.
      */}
      <ul className="proof">
        {proof.map((p) => (
          <li key={p.label}>
            <span className="proof-label">{p.label}</span>
            <span className="proof-text">{p.text}</span>
            {p.links.map((l) => (
              <a className="proof-link" key={l.href} href={l.href} rel="noopener">
                {l.label}
              </a>
            ))}
          </li>
        ))}
        {r.longestSpan && (
          <li>
            <span className="proof-label">{r.longestSpan.days} days</span>
            <span className="proof-text">
              A deployment that reported success while shipping nothing. Found,
              explained, fixed.
            </span>
            <Link className="proof-link" href={`/writing/${r.longestSpan.slug}/`}>
              read it
            </Link>
          </li>
        )}
      </ul>

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--against-body">
          <span className="rail--label">Writing</span>
          <span>{r.posts} {r.posts === 1 ? "post" : "posts"}</span>
          <span>{n(r.words)} words</span>
          {r.latest && <span>latest {r.daysSinceLatest} days ago</span>}
        </span>
        <div>
          <div className="section-head">
            <h2>Things I&apos;ve written down</h2>
            <Link href="/writing/">all posts</Link>
          </div>
          <PostList posts={posts.slice(0, 5)} />
        </div>
      </section>

      {/*
        Two lists, not one. The thing a stranger can install sits above the two
        things only I run, because listing them as equals averages the first
        down to the second. The split is `Project.side`, not array position, so
        adding a project cannot silently promote it.

        The heading no longer starts "Things I've". Three sections in a row
        opening with the same four words read as a tic rather than as a voice.
      */}
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
            <Link href="/projects/">all projects</Link>
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
                    <Link href={`/topics/${t.slug}/`}>
                      {topicName(t.slug)}
                      {/* A count of 1 is not a count, it is a label repeating
                          itself. The row stays — hiding every topic backed by
                          one thing would hide debugging, observability and
                          CI/CD, which is most of what this site is now for. */}
                      {t.total > 1 && <span className="rail-count">{t.total}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/*
        The ratio stays because it is counted and it is the site admitting
        something. The commentary around it is gone: the number was making the
        joke and the sentence was explaining it.
      */}
      <p className="home-note">
        {n(r.codeLines + r.cssLines)} lines of code and CSS for {n(r.words)}{" "}
        words. Counted at build, <time dateTime={r.builtOn}>{r.builtOn}</time> —
        like every figure on this page.
      </p>

      <Footer />
    </main>
  );
}
