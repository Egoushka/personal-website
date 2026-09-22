import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { highlighter, shikiOptions } from "@/lib/highlight";
import rehypeSlug from "rehype-slug";
import Nav from "@/components/Nav";
import { BlogPostingLd } from "@/components/JsonLd";
import Footer from "@/components/Footer";
import Comments from "@/components/Comments";
import { site, feedTypes } from "@/lib/site";
import {
  getAllSlugs,
  getPost,
  formatDate,
  tableOfContents,
  getRelatedPosts,
} from "@/lib/posts";
import { getReadings, getTopicUsage, n } from "@/lib/readings";
import { TOPICS, isTopic, topicName } from "@/lib/topics";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  const url = `${site.url}/writing/${slug}/`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.topics,
    alternates: { canonical: url, types: feedTypes },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName: site.name,
      locale: site.locale,
      publishedTime: post.date,
      authors: [site.name],
      tags: post.topics,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const post = getPost(slug);
  const toc = tableOfContents(post.content);
  const related = getRelatedPosts(slug, 1)[0];
  const usage = getTopicUsage();
  const daysAgo = Math.round(
    (Date.parse(getReadings().builtOn) - Date.parse(post.date)) / 86_400_000,
  );

  return (
    <>
      <main id="main" className="wrap">
        <Nav current="writing" />
        <BlogPostingLd post={post} />

        {/*
          The title and its figures are their own block above the two-column
          body, and not rows the sidebar spans.

          They used to be: the header rail was placed `grid-row: 1 / span 2` so
          the topics and the contents list could sit beside the h1. A grid item
          spanning auto-sized rows makes those rows grow to hold it, so an
          eight-entry table of contents pushed the date roughly 250px clear of
          the title it belonged to. Nothing spans rows now, so nothing can
          stretch them.
        */}
        <header className="post-head">
          <h1>{post.title}</h1>
          <p className="page-figures">
            <span><time dateTime={post.date}>{formatDate(post.date)}</time></span>
            <span>{n(post.wordCount)} words</span>
            <span>{post.readingTime} min read</span>
            <span>{daysAgo} {daysAgo === 1 ? "day" : "days"} ago</span>
          </p>
        </header>

        {/*
          One grid row holding a sticky rail and the article, rather than the
          article spanning both columns. This is what lets the contents list
          follow the reader the whole way down: a sticky item travels its grid
          area, and here that area is the full height of the post.
        */}
        <div className="post-layout">
          {toc.length > 1 && (
            <aside className="post-aside">
              {/*
                Below 900px this collapses to a closed <details> — the one place
                the rail becomes interactive without JavaScript. Above it the
                disclosure dissolves and the list is a plain sticky column.

                The current-section mark IS JavaScript, and it is additive: the
                links are in the static HTML and work with the indicator never
                moving. See the scroll-spy script at the foot of this file.
              */}
              <details className="toc-details rail--group">
                <summary>On this page <span className="rail-count">{toc.length}</span></summary>
                <span className="rail--label">On this page</span>
                <ol className="toc">
                  {toc.map((h) => (
                    <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                  ))}
                </ol>
              </details>
            </aside>
          )}

          <article className="prose post-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeSlug,
                [rehypeShikiFromHighlighter, highlighter, shikiOptions],
              ]}
              components={{
                /*
                  Every h2 gets a full-width hairline above it and its number on
                  the line above the words. The number is a CSS counter, so
                  nothing in the markdown pipeline has to know about section
                  numbering. It used to live out in the rail; the rail is the
                  contents list now, and two things cannot share one column.
                */
                h2: ({ children, ...props }) => (
                  <>
                    <hr className="bleed" />
                    <h2 {...props}>
                      <span className="sect-mark" aria-hidden="true" />
                      {children}
                    </h2>
                  </>
                ),
                /*
                  A code block is one object, not two.

                  It used to hang off the rail — language label and copy button
                  out in the margin, the block itself bleeding left into the
                  gutter — so the code started at a different left edge from
                  every sentence around it, and the control that acted on it sat
                  somewhere else entirely. Now it is a figure in the prose
                  column: its own header carrying the language and the copy
                  button, and the code beneath, sharing the paragraph's edge.

                  The button is server-rendered inside React's tree. An earlier
                  version injected it after parse and hydration reconciled the
                  <pre> and stripped it straight back out.
                */
                pre: ({ children, className, ...props }) => {
                  const lang = extractLang(children, props);
                  return (
                    <figure className="code">
                      <figcaption className="code-head">
                        <span className="code-lang">{lang}</span>
                        <button type="button" className="copy-btn" aria-label="Copy code to clipboard">
                          Copy
                        </button>
                      </figcaption>
                      {/*
                        Shiki puts its own className on the <pre> it produces, and
                        it has to be merged rather than spread over the top:
                        `{...props}` after a literal className silently dropped
                        ours once already.
                      */}
                      <pre className={className} {...props}>
                        {children}
                      </pre>
                    </figure>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        </div>

        {/*
          The one measurement a piece of writing can make about itself: the words
          spent against the stretch of time they report on. Printed only when the
          post declares that stretch in its frontmatter — there is no default,
          and a span is never inferred from the prose.
        */}
        {post.spanDays ? (
          <div className="row">
            <span className="rail rail--label">For scale</span>
            <p className="page-figures">
              {n(post.wordCount)} words about {post.spanDays} days —{" "}
              {Math.round(post.wordCount / post.spanDays)} words for every day of it.
            </p>
          </div>
        ) : null}

        {/*
          Topics, at the end, where a filing decision belongs — and carrying what
          the reader actually wants from one: what the topic is, and how much
          else is under it. Two words stacked in the margin said neither, and
          they said it next to the title, before anyone had read a sentence.
        */}
        {post.topics.length > 0 && (
          <>
            <hr className="bleed" />
            <section className="filed bleed" aria-labelledby="filed-under">
              <h2 className="rail--label" id="filed-under">Filed under</h2>
              <ul className="filed-list">
                {post.topics.filter(isTopic).map((t) => {
                  const u = usage.find((x) => x.slug === t);
                  return (
                    <li className="filed-item" key={t}>
                      <Link href={`/topics/${t}/`}>{topicName(t)}</Link>
                      <p>{TOPICS[t].blurb}</p>
                      {/* Only what the topic actually has: "0 projects" is a
                          true statement that reads as a shortfall. */}
                      {u && (
                        <span className="run filed-count">
                          {u.posts > 0 && <span>{u.posts} {u.posts === 1 ? "post" : "posts"}</span>}
                          {u.projects > 0 && <span>{u.projects} {u.projects === 1 ? "project" : "projects"}</span>}
                          {u.jobs > 0 && <span>{u.jobs} {u.jobs === 1 ? "role" : "roles"}</span>}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        {/* One link, not a grid of cards. */}
        {related && (
          <>
            <hr className="bleed" />
            <div className="row">
              <span className="rail rail--label">Read next</span>
              <div className="post-item">
                <h2><Link href={`/writing/${related.slug}/`}>{related.title}</Link></h2>
                <p className="run"><span>{formatDate(related.date)}</span><span>{related.readingTime} min read</span></p>
              </div>
            </div>
          </>
        )}

        <hr className="bleed" />
        <Comments url={`${site.url}/writing/${post.slug}/`} />

        {/*
          Two plain scripts rather than client components: a React island for a
          copy button and a scroll position would put hydration on every post to
          run about thirty lines of DOM work.

          One — one delegated listener on document, rather than a listener per
          code block: it survives any DOM reconciliation and costs nothing per
          block.

          Two — the contents list's current-section mark. Reads positions on a
          rAF-throttled scroll, sets `aria-current` on the live link and two
          custom properties the CSS draws the indicator from, and keeps the
          active row inside the scrolling rail. Everything it touches is
          decoration: with it removed the list is still a list of working links.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".copy-btn"); if(!b) return;
  var block=b.closest("figure.code"); if(!block) return;
  var pre=block.querySelector("pre"); if(!pre) return;
  var code=pre.querySelector("code")||pre;
  // clipboard is undefined outside a secure context; bail rather than throw
  if(!navigator.clipboard){ b.textContent="no clipboard"; return; }
  navigator.clipboard.writeText(code.innerText).then(function(){
    b.textContent="Copied"; b.classList.add("is-copied");
    setTimeout(function(){b.textContent="Copy";b.classList.remove("is-copied")},1600);
  },function(){ b.textContent="failed"; });
});
(function(){
  var ol=document.querySelector(".toc"); if(!ol) return;
  var links=Array.prototype.slice.call(ol.querySelectorAll("a"));
  var heads=links.map(function(a){
    try { return document.getElementById(decodeURIComponent(a.hash.slice(1))); }
    catch(_) { return null; }
  });
  var box=ol.closest(".post-aside")||ol;
  var still=matchMedia("(prefers-reduced-motion: reduce)");
  var cur=-1, queued=false;
  function mark(){
    queued=false;
    var i=0;
    // the last heading whose top has passed the reading line
    for(var j=0;j<heads.length;j++){
      if(heads[j] && heads[j].getBoundingClientRect().top<=140) i=j;
    }
    if(i===cur) return;
    cur=i;
    for(var k=0;k<links.length;k++){
      if(k===i) links[k].setAttribute("aria-current","location");
      else links[k].removeAttribute("aria-current");
    }
    var li=links[i].parentNode;
    ol.style.setProperty("--toc-y", li.offsetTop+"px");
    ol.style.setProperty("--toc-h", li.offsetHeight+"px");
    // the rail scrolls independently once the list outruns the viewport
    if(box.scrollHeight>box.clientHeight+1){
      var top=ol.offsetTop+li.offsetTop-box.clientHeight/2+li.offsetHeight/2;
      if(box.scrollTo) box.scrollTo({top:top,behavior:still.matches?"auto":"smooth"});
      else box.scrollTop=top;
    }
  }
  function schedule(){ if(!queued){ queued=true; requestAnimationFrame(mark); } }
  addEventListener("scroll",schedule,{passive:true});
  addEventListener("resize",function(){cur=-1;schedule();},{passive:true});
  mark();
})();`,
          }}
        />
      </main>
      <div className="wrap"><Footer /></div>
    </>
  );
}

/**
 * The source language, for the code block's header.
 *
 * Two shapes to handle: rehype-shiki moves the language onto the <pre> as
 * `data-language` and strips `language-*` off the <code>, while an untagged
 * fence never had one at all. Reading only the <code> className found nothing
 * on exactly the blocks that were highlighted.
 */
function extractLang(
  children: React.ReactNode,
  preProps: Record<string, unknown>,
): string | null {
  const fromPre = preProps["data-language"];
  if (typeof fromPre === "string" && fromPre && fromPre !== "text") return fromPre;

  const child = Array.isArray(children) ? children[0] : children;
  const cls = (child as { props?: { className?: string } })?.props?.className ?? "";
  const hit = /language-([\w-]+)/.exec(cls);
  return hit ? hit[1] : null;
}
