import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubLight from "shiki/themes/github-light.mjs";
import githubDark from "shiki/themes/github-dark-default.mjs";
import bash from "shiki/langs/bash.mjs";
import yaml from "shiki/langs/yaml.mjs";
import json from "shiki/langs/json.mjs";
import csharp from "shiki/langs/csharp.mjs";
import typescript from "shiki/langs/typescript.mjs";
import sql from "shiki/langs/sql.mjs";

/**
 * Synchronous Shiki highlighter.
 *
 * react-markdown runs its unified pipeline with `runSync`, so the stock async
 * `@shikijs/rehype` fails with "runSync finished async". `createHighlighterCoreSync`
 * plus the JavaScript regex engine (rather than the WASM oniguruma one, which
 * loads asynchronously) makes it synchronous.
 *
 * Languages and themes are imported explicitly instead of using the `shiki`
 * bundle: the full bundle is ~1.2 MB of grammars, almost all of which this blog
 * will never use. Add a language here when a post needs it — an unknown language
 * degrades to plain text rather than failing the build.
 */
export const highlighter = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [bash, yaml, json, csharp, typescript, sql],
  engine: createJavaScriptRegexEngine(),
});

/** Dual-theme output: Shiki emits both, CSS variables choose. No flash, no client JS. */
export const shikiOptions = {
  themes: { light: "github-light", dark: "github-dark-default" },
  defaultColor: false,
  cssVariablePrefix: "--s-",
} as const;
