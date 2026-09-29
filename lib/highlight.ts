import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubLight from "shiki/themes/github-light-default.mjs";
import githubDark from "shiki/themes/github-dark-default.mjs";
import bash from "shiki/langs/bash.mjs";
import yaml from "shiki/langs/yaml.mjs";
import json from "shiki/langs/json.mjs";
import csharp from "shiki/langs/csharp.mjs";
import typescript from "shiki/langs/typescript.mjs";
import sql from "shiki/langs/sql.mjs";
import python from "shiki/langs/python.mjs";
import javascript from "shiki/langs/javascript.mjs";
import tsx from "shiki/langs/tsx.mjs";
import toml from "shiki/langs/toml.mjs";
import docker from "shiki/langs/docker.mjs";
import diff from "shiki/langs/diff.mjs";
import markdown from "shiki/langs/markdown.mjs";
import ini from "shiki/langs/ini.mjs";
import powershell from "shiki/langs/powershell.mjs";
import jsonc from "shiki/langs/jsonc.mjs";
import dotenv from "shiki/langs/dotenv.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import xml from "shiki/langs/xml.mjs";
import makefile from "shiki/langs/makefile.mjs";
import shellsession from "shiki/langs/shellsession.mjs";

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
 * will never use. Add a language here when a post or a project's docs need it —
 * an unknown language degrades to plain text rather than failing the build. Each
 * grammar's aliases come with it (`sh` and `zsh` with bash, `py` with python).
 */
export const highlighter = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [
    bash, yaml, json, csharp, typescript, sql, python, javascript, tsx, toml, docker,
    diff, markdown, ini, powershell, jsonc, dotenv, css, html, xml, makefile, shellsession,
  ],
  engine: createJavaScriptRegexEngine(),
});

/**
 * Dual-theme output: Shiki emits both, CSS variables choose. No flash, no client JS.
 *
 * `defaultLanguage` sends an untagged fence through Shiki too, so every block
 * gets the same theme and markup; `addLanguageClass` keeps `language-*` on the
 * <code> for the header's label, and a `title="…"` after the language becomes
 * the header's title.
 */
export const shikiOptions = {
  themes: { light: "github-light-default", dark: "github-dark-default" },
  defaultLanguage: "text",
  addLanguageClass: true,
  defaultColor: false,
  cssVariablePrefix: "--s-",
  transformers: [
    {
      name: "title-from-meta",
      // ```bash title="Run the server" → data-title on the <pre>, which the
      // code block's header prints (components/Prose.tsx).
      pre(node) {
        const raw = (this.options.meta as { __raw?: string } | undefined)?.__raw;
        const title = raw?.match(/\btitle="([^"]+)"/)?.[1];
        if (title) node.properties["data-title"] = title;
      },
    },
  ],
} satisfies Parameters<typeof import("@shikijs/rehype/core").default>[1];
