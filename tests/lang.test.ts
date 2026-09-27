import { test } from "node:test";
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { langOf, rehypeCyrillic, splitCyrillic, type CyrillicLang } from "../lib/lang";

const html = (md: string, lang?: CyrillicLang) =>
  String(
    unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeCyrillic(lang)).use(rehypeStringify).processSync(md),
  ).trim();

test("Cyrillic runs are split out of plain text", () => {
  assert.deepEqual(splitCyrillic('the word "ок"'), [
    { text: 'the word "', cyrillic: false },
    { text: "ок", cyrillic: true },
    { text: '"', cyrillic: false },
  ]);
  // Words joined by spaces are one run; a comma ends it.
  assert.deepEqual(splitCyrillic("Слава Україні, РНОКПП!").filter((s) => s.cyrillic).map((s) => s.text), [
    "Слава Україні",
    "РНОКПП",
  ]);
  assert.deepEqual(splitCyrillic("plain"), [{ text: "plain", cyrillic: false }]);
});

test("a language per post, or per term", () => {
  assert.equal(langOf("ок", "ru"), "ru");
  assert.equal(langOf("РНОКПП", { РНОКПП: "uk", ИНН: "ru" }), "uk");
  assert.equal(langOf("СНИЛС", { РНОКПП: "uk" }), undefined);
  assert.equal(langOf("ок", undefined), undefined);
});

test("a post body's Cyrillic gets lang; code blocks and undeclared posts do not", () => {
  assert.equal(
    html("Mostly `ок`. And «ага».", "ru"),
    '<p>Mostly <code><span lang="ru">ок</span></code>. And «<span lang="ru">ага</span>».</p>',
  );
  assert.equal(html("```\nпривіт\n```", "uk"), "<pre><code>привіт\n</code></pre>");
  assert.equal(html("`ок`"), "<p><code>ок</code></p>");
});
