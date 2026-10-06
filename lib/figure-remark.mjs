// Turns what a post's markdown says about figures into nodes a renderer can
// build: the site and the feeds both run it, each saying what a block becomes.
// The two shapes are a ```chart / ```diagram fence and an image with a title,
// which is its caption (ADR 0010).
import { FIGURE_LANGS } from "./figures.mjs";

/**
 * @param {{ block: (node: { lang: string, value: string }, index: number) => Record<string, unknown> }} options
 *   `block` returns the hast data (`hName`, `hProperties`, `hChildren`) a figure fence becomes.
 */
export function remarkFigures({ block }) {
  return () => (/** @type {any} */ tree) => {
    let index = 0;
    /** @param {any} node */
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((/** @type {any} */ child) => {
        if (child.type === "code" && FIGURE_LANGS.includes(child.lang)) {
          return { type: "figureBlock", data: block({ lang: child.lang, value: child.value }, index++) };
        }
        if (child.type === "paragraph") captioned(child);
        else walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

/**
 * A paragraph holding only an image with a title is a figure: the image, and the
 * title as its <figcaption>. The title moves out of the <img>, where it would
 * show as a tooltip and be read twice.
 * @param {any} p
 */
function captioned(p) {
  const kids = p.children.filter((/** @type {any} */ c) => !(c.type === "text" && c.value.trim() === ""));
  if (kids.length !== 1 || kids[0].type !== "image" || !kids[0].title) return;
  const [image] = kids;
  const caption = { type: "paragraph", data: { hName: "figcaption" }, children: [{ type: "text", value: image.title }] };
  image.title = null;
  p.data = { hName: "figure", hProperties: { className: ["post-figure"] } };
  p.children = [image, caption];
}
