import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { PersonAndSiteLd } from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import BoxPanel from "@/components/BoxPanel";
import CodingPanel from "@/components/CodingPanel";
import FeedPanel from "@/components/FeedPanel";
import ProductList from "@/components/ProductList";
import StatusFig from "@/components/StatusFig";
import { ArrowRight, Check, X, Users, Plug, Megaphone, MessageSquare } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { pickNext } from "@/lib/next-step";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getAllPosts } from "@/lib/posts";
import { getReadings, getTopicUsage, n } from "@/lib/readings";
import { topicName } from "@/lib/topics";
import { ATTEST_FALLBACK, CHANNELS, CHARGEHAND, PRODUCTS, READ_DATE, SELF_CHECK, STATE_NOTE } from "@/lib/shop";

const ICON = { users: Users, plug: Plug, megaphone: Megaphone, message: MessageSquare };

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
export default function Home() {
  const r = getReadings();
  const posts = getAllPosts();
  const newest = posts[0];
  const start = { read: newest, tryIt: newest ? pickNext(newest, posts, undefined).tryIt : undefined };
  /*
    Every topic anything references, not just the ones posts use: a section
    headed "things I keep coming back to" should not be silent about the ones I
    am paid to come back to, and a topic page nothing links to is orphaned.
  */
  const topics = getTopicUsage();

  return (
    <Shell current="home">
      <PersonAndSiteLd />

      <header className="hero">
        <div>
          <h1>{site.intro}</h1>
          <p className="lede">
            Read from my own box, not typed. Seven products, one live box, every number with a source. Essentials are
            free. Only the truly advanced parts cost money, and none has a price yet.
          </p>
          <div className="acts">
            <Link className="key key-primary key-lg" href="/shop/">
              See the products <ArrowRight />
            </Link>
            <Link className="key key-lg" href="/partner/">
              Build one with me
            </Link>
            <Link className="key key-ghost key-lg" href="/writing/">
              Read the writing
            </Link>
          </div>
        </div>
        <section aria-labelledby="now-h">
          <h2 id="now-h" className="mb-3 text-sm font-semibold text-muted-foreground">
            Right now
          </h2>
          <div className="kpis">
            <div className="kpi">
              <span>Products</span>
              <span className="figv">{PRODUCTS.length}</span>
              <em>{STATE_NOTE}</em>
            </div>
            <div className="kpi">
              <span>Paying users</span>
              <span className="figv">0</span>
              <em>none takes money yet</em>
            </div>
            <div className="kpi">
              <span>Pull requests, chargehand</span>
              <a
                className="figv"
                href="https://github.com/Egoushka/chargehand/pulls?q=is%3Apr"
                rel="noopener"
              >
                {CHARGEHAND.prs}
              </a>
              <em>
                to v{CHARGEHAND.version}, read {READ_DATE}
              </em>
            </div>
            <div className="kpi">
              <span>Attest downloads</span>
              <a className="figv" href="https://www.nuget.org/packages/Attest" rel="noopener">
                <StatusFig pick="downloads" fallback={String(ATTEST_FALLBACK.downloads)} />
              </a>
              <em>NuGet, v{ATTEST_FALLBACK.version}</em>
            </div>
          </div>
        </section>
      </header>

      {/* One thing to read and one to try, from the newest post. A click is the home-read or home-try event. */}
      <div className="-mt-4 mb-10">
        <NextStep step={start} from="home" event="home" heading="Start here" />
      </div>

      <div className="mc-grid">
        <div style={{ "--c": 5 } as React.CSSProperties} className="mc-col">
          <BoxPanel />
          <CodingPanel />
        </div>
        <div style={{ "--c": 7 } as React.CSSProperties} className="mc-col">
          <FeedPanel />
          <section className="pn" aria-labelledby="prod-h">
            <div className="pn-head">
              <h2 id="prod-h">Products</h2>
              <Link className="key key-ghost key-sm" href="/shop/">
                Shop
              </Link>
            </div>
            <ProductList />
            <div className="pn-foot">
              <Link href="/projects/">all {r.projects} projects</Link>
              <span>free part listed before the paid part</span>
            </div>
          </section>
        </div>

        <section className="pn wide" style={{ "--c": 12 } as React.CSSProperties} aria-labelledby="check-h">
          <div className="pn-head">
            <h2 id="check-h">This site, checked the way the checker will check yours</h2>
            <span className="chip">recorded by hand</span>
          </div>
          <div className="score">
            <b>
              {SELF_CHECK.filter((c) => c.ok).length}/{SELF_CHECK.filter((c) => !c.na).length}
            </b>
            <span className="text-sm text-muted-foreground">checks pass, fetched against the built site; x402 does not apply here</span>
            <span className="text-xs text-muted-foreground">2026-11-11 02:10 UTC</span>
          </div>
          <ul className="sc">
            {SELF_CHECK.map((c) => (
              <li key={c.name}>
                <span className={c.na ? "sci sci-na" : c.ok ? "sci sci-ok" : "sci sci-no"}>
                  {c.na ? <span aria-hidden="true">–</span> : c.ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                  <span className="visually-hidden">{c.na ? "not applicable" : c.ok ? "passes" : "fails"}</span>
                </span>
                <b>{c.name}</b>
                <code className="num truncate text-xs">{c.target}</code>
                <span className="num text-xs">{c.code}</span>
                <span className="col-span-4 text-xs text-muted-foreground">{c.note}</span>
              </li>
            ))}
          </ul>
          <div className="pn-foot">
            <span>checker: 0 runs, not deployed</span>
            <span>hand-recorded, not live</span>
          </div>
        </section>

        <section className="pn" style={{ "--c": 6 } as React.CSSProperties} aria-labelledby="posts-h">
          <div className="pn-head">
            <h2 id="posts-h">Writing</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {r.posts} {r.posts === 1 ? "post" : "posts"} · {n(r.words)} words
            </span>
          </div>
          <ul className="posts">
            {posts.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link prefetch={false} href={`/writing/${p.slug}/`}>
                  <span className="meta">
                    {formatDate(p.date)}
                    {p.readingTime ? ` · ${p.readingTime} min read` : ""}
                  </span>
                  <b>{p.title}</b>
                </Link>
              </li>
            ))}
          </ul>
          <div className="pn-foot">
            <Link prefetch={false} href="/writing/">
              all {r.posts} posts
            </Link>
            <a href="/feed.xml">RSS</a>
          </div>
        </section>

        <section className="pn" style={{ "--c": 6 } as React.CSSProperties} aria-labelledby="open-h">
          <div className="pn-head">
            <h2 id="open-h">Open to partners</h2>
            <span className="chip chip-good">{CHANNELS.length} open</span>
          </div>
          <ul className="chan">
            {CHANNELS.map((c) => {
              const Icon = ICON[c.icon];
              return (
                <li key={c.id}>
                  <Icon aria-hidden="true" />
                  <b>{c.name}</b>
                  <p>{c.text}</p>
                </li>
              );
            })}
          </ul>
          <Link className="key" href="/partner/">
            How partnering works
          </Link>
        </section>
      </div>

      {topics.length > 0 && (
        <section className="mt-24" aria-labelledby="home-topics">
          <h2 id="home-topics" className="font-display text-3xl font-semibold tracking-tight">
            Things I keep coming back to
          </h2>
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
