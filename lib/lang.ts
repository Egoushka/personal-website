/**
 * Cyrillic in an English page, marked with its language, so a screen reader
 * reads it in the right voice instead of spelling out letters (WCAG 3.1.2).
 *
 * The language comes from the post's `cyrillic` frontmatter. It is declared,
 * never guessed: "ок" and "ага" are Ukrainian and Russian alike, and a wrong
 * `lang` is worse than none. Pure, so the server pipeline and the client-side
 * lists share it.
 */
export type CyrillicLang = "uk" | "ru";

/**
 * One language for every Cyrillic run (a post's `cyrillic` frontmatter), or the
 * language of each term (a project's `cyrillic`, where one sentence can name a
 * Ukrainian identifier beside two Russian ones).
 */
export type LangSpec = CyrillicLang | Readonly<Record<string, CyrillicLang>>;

/** The language a run is marked with, or undefined when the spec does not name it. */
export function langOf(run: string, spec: LangSpec | undefined): CyrillicLang | undefined {
  return typeof spec === "string" ? spec : spec?.[run];
}

/** Cyrillic words, with the spaces, hyphens and apostrophes between them. */
const RUN = /[\u0400-\u04FF]+(?:[\s'’-]+[\u0400-\u04FF]+)*/g;

export type Segment = { text: string; cyrillic: boolean };

/** `the word "ок"` → `the word "`, `ок` (Cyrillic), `"`. */
export function splitCyrillic(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), cyrillic: false });
    out.push({ text: m[0], cyrillic: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), cyrillic: false });
  return out;
}

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/**
 * Rehype plugin: each Cyrillic run in a post body becomes `<span lang>`.
 * Code blocks are left alone: a `<pre>` is code, and Shiki owns its markup.
 * Inline code is tagged, because `ок` in backticks is still a word.
 */
export function rehypeCyrillic(lang: CyrillicLang | undefined) {
  return () => (tree: HastNode) => {
    if (!lang) return;
    const visit = (node: HastNode) => {
      if (!node.children || node.tagName === "pre") return;
      node.children = node.children.flatMap((child): HastNode[] => {
        if (child.type !== "text" || !child.value) {
          visit(child);
          return [child];
        }
        const parts = splitCyrillic(child.value);
        if (!parts.some((p) => p.cyrillic)) return [child];
        return parts.map((p) =>
          p.cyrillic
            ? { type: "element", tagName: "span", properties: { lang }, children: [{ type: "text", value: p.text }] }
            : { type: "text", value: p.text },
        );
      });
    };
    visit(tree);
  };
}
