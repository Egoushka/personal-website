import { langOf, splitCyrillic, type LangSpec } from "@/lib/lang";

/**
 * Plain text with its Cyrillic runs in `<span lang>` — for post titles and
 * project text, which reach a page as strings rather than through the markdown
 * pipeline. A run the spec does not name is left as it is.
 */
export default function Lang({ text, lang }: { text: string; lang?: LangSpec }) {
  if (!lang) return text;
  return splitCyrillic(text).map((p, i) => {
    const l = p.cyrillic ? langOf(p.text, lang) : undefined;
    return l ? <span key={i} lang={l}>{p.text}</span> : p.text;
  });
}
