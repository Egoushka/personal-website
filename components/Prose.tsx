import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeSlug from "rehype-slug";
import remarkCallouts from "@/lib/callouts.mjs";
import { highlighter, shikiOptions } from "@/lib/highlight";
import { rehypeCyrillic } from "@/lib/lang";
import { rehypeTables } from "@/lib/tables";
import type { CyrillicLang } from "@/lib/lang";

/**
 * Markdown as the site renders it: a post's body and a project's docs, through
 * one pipeline so the two cannot drift apart — the same highlighting, headings,
 * code figures, tables, callouts and Cyrillic marking. The wrapper carries the
 * typography (`.markdown` in globals.css); this renders the parts it styles.
 *
 * `resolveHref` rewrites link targets and is only for docs, whose relative links
 * were written for the tool's repository (lib/doc-links.mjs). A post's links are
 * already site routes and pass through untouched.
 */
export default function Prose({
  markdown,
  cyrillic,
  resolveHref,
}: {
  markdown: string;
  cyrillic?: CyrillicLang;
  resolveHref?: (href: string) => string;
}) {
  /*
    A heading and its permalink, as siblings: the link inside the heading would
    join the heading's accessible name ("Status, link"). The wrapper carries the
    heading's spacing; the heading keeps the id the contents list points at.
    `node` is react-markdown's hast node: spread, it prints as node="[object Object]".
  */
  const heading =
    (Tag: "h2" | "h3") =>
    ({ node: _node, children, ...props }: React.ComponentProps<"h2"> & { node?: unknown }) => (
      <div className={`heading-wrap heading-wrap--${Tag}`}>
        <Tag {...props}>{children}</Tag>
        {props.id && (
          <a className="heading-anchor" href={`#${props.id}`} data-pagefind-ignore>
            <span aria-hidden="true">#</span>
            <span className="visually-hidden">Link to this section</span>
          </a>
        )}
      </div>
    );

  const components: Components = {
    h2: heading("h2"),
    h3: heading("h3"),
    /*
      A code block is one object: a figure with a header carrying its title or
      language and the Copy button, and the code beneath it.

      The button is server-rendered inside React's tree: injected after parse,
      hydration reconciles the <pre> and strips it out. The header is a
      <figcaption> only when there is something to name; otherwise it is a plain
      box holding the button, and it goes with the button when there is no
      JavaScript.
    */
    pre: ({ node: _node, children, className, ...props }) => {
      const lang = extractLang(children, props);
      const title = typeof props["data-title" as keyof typeof props] === "string"
        ? (props["data-title" as keyof typeof props] as string)
        : null;
      const controls = (
        <>
          <button type="button" className="copy-btn">Copy</button>
          <span className="copy-status visually-hidden" role="status" />
        </>
      );
      return (
        <figure className="code not-prose">
          {title || lang ? (
            <figcaption className="code-head">
              {title && <span className="code-title">{title}</span>}
              {lang && <span className="code-lang">{lang}</span>}
              {controls}
            </figcaption>
          ) : (
            <div className="code-head code-head--bare">{controls}</div>
          )}
          {/*
            Shiki's className on the <pre> is merged, not spread over: `{...props}`
            after a literal className drops ours. tabIndex comes first so a
            scrollable block is reachable by keyboard whatever the props carry.
          */}
          <pre tabIndex={0} className={className} {...props}>
            {children}
          </pre>
        </figure>
      );
    },
  };
  if (resolveHref) {
    components.a = ({ node: _node, href, ...props }) => (
      <a href={href === undefined ? undefined : resolveHref(href)} {...props} />
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCallouts]}
      rehypePlugins={[
        rehypeSlug,
        rehypeTables,
        [rehypeShikiFromHighlighter, highlighter, shikiOptions],
        rehypeCyrillic(cyrillic),
      ]}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
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
  return hit && hit[1] !== "text" ? hit[1] : null;
}
