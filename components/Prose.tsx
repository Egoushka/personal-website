import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeSlug from "rehype-slug";
import { highlighter, shikiOptions } from "@/lib/highlight";
import { rehypeCyrillic } from "@/lib/lang";
import type { CyrillicLang } from "@/lib/lang";

/**
 * Markdown as the site renders it: a post's body, and a project's docs, through
 * one pipeline so the two cannot drift apart — the same highlighting, section
 * marks, code figures and Cyrillic marking.
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
  const components: Components = {
    /*
      Every h2 gets a full-width hairline above it and its number on
      the line above the words. The number is a CSS counter, so
      nothing in the markdown pipeline has to know about section
      numbering, and it is the section's permalink. `node` is
      react-markdown's hast node: spread, it prints as
      node="[object Object]".
    */
    h2: ({ node: _node, children, ...props }) => (
      <>
        <hr className="bleed" />
        <h2 {...props}>
          <a
            className="sect-mark"
            href={`#${props.id}`}
            aria-label="Link to this section"
            data-pagefind-ignore
          />
          {children}
        </h2>
      </>
    ),
    /*
      A code block is one object: a figure in the prose column with a
      header carrying the language and the Copy button, and the code
      beneath it, sharing the paragraph's edge.

      The button is server-rendered inside React's tree: injected
      after parse, hydration reconciles the <pre> and strips it out.
      The language is a <figcaption> only when the fence declared
      one; otherwise the header is a plain box holding the button,
      and it goes with the button when there is no JavaScript.
    */
    pre: ({ node: _node, children, className, ...props }) => {
      const lang = extractLang(children, props);
      const controls = (
        <>
          <button type="button" className="copy-btn">Copy</button>
          <span className="copy-status visually-hidden" role="status" />
        </>
      );
      return (
        <figure className="code">
          {lang ? (
            <figcaption className="code-head">
              <span className="code-lang">{lang}</span>
              {controls}
            </figcaption>
          ) : (
            <div className="code-head code-head--bare">{controls}</div>
          )}
          {/*
            Shiki's className on the <pre> is merged, not spread over:
            `{...props}` after a literal className drops ours.
            tabIndex comes first so a scrollable block is reachable
            by keyboard whatever the props carry.
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
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSlug,
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
