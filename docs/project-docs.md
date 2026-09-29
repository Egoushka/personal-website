# Writing a project's docs

The contract between a project's repository and the docs this site renders at
`/projects/<slug>/docs/`. The docs are written in the project's own repository and
copied here at a commit ([ADR 0006](adr/0006-docs-are-written-where-the-code-is.md));
this page says what that directory must look like and what the site does with it.

Check a docs directory from a checkout of this site before pushing it:

```bash
npm run docs:check -- ../<repo>/docs/guide
```

It runs the rules below and checks every link into the rest of that repository.

## Files

- One flat directory, conventionally `docs/guide/`. Markdown only: the pull copies
  `*.md` and nothing else, so no images and no subdirectories.
- The file name is the URL: lowercase kebab-case. `quickstart.md` renders at
  `/projects/<slug>/docs/quickstart/`.
- `index.md` is required. It is the overview and the docs root.

## Frontmatter

```yaml
---
title: "Quickstart"
description: "Install the package, validate one national ID, and read the result."
order: 2
section: "Get started"
---
```

| Field | Rule | Where it shows |
|---|---|---|
| `title` | required, sentence case, 48 characters or fewer | the page's h1, the sidebar, the tab title |
| `description` | required, one sentence, 160 characters or fewer | the lead under the title, cards, search, the meta description |
| `order` | required, a whole number unique within the docs | the order inside its section; `index.md` has the lowest |
| `section` | optional, one of the five below; `Guides` when absent | the sidebar group |
| `cyrillic` | `"uk"` or `"ru"`, required once the page has Cyrillic text | the `lang` its Cyrillic words are marked with |

The sections are a closed list, printed in this order, so every project's sidebar
reads the same way. Previous and Next follow the sidebar: section by section, then
`order` inside each.

| Section | Holds |
|---|---|
| Get started | the overview, installation, the quickstart |
| Guides | one page per task a user sets out to do |
| Concepts | how it works inside, and the words it uses |
| Reference | every command, option, route, tool, field and environment variable |
| Project | status and evidence, decisions, changelog, contributing |

`index.md` belongs in Get started, as its first entry; any other `section` on it fails the check.

## The page set

Not every project needs every page. A small tool is well served by four: overview,
quickstart, reference, status. Split a page when its "On this page" list passes about
eight entries.

| Page | Section | Answers |
|---|---|---|
| `index.md`, Overview | Get started | What it is, who it is for, how it works in one paragraph, what it does not do, where it stands |
| `quickstart.md` | Get started | From nothing to one working result, every command copyable |
| `installation.md` | Get started | Requirements and every way to install, when the quickstart cannot hold them |
| one page per task | Guides | "How do I …", start to finish |
| `architecture.md` | Concepts | The moving parts and how a request flows through them |
| `reference.md` or `configuration.md` | Reference | Tables of every command, option and variable, with defaults |
| `status.md` | Project | What works, what is partial, what is not built, and the test or benchmark behind each |
| `decisions.md` | Project | The ADRs, one line each |

## Markdown

- No `# heading`: the title renders as the page's h1. `##` starts a section and is
  listed under "On this page"; `###` is listed under its section. Deeper headings are
  not listed.
- **Callouts** use GitHub's alert syntax, so they render on GitHub and here:

  ```markdown
  > [!NOTE]
  > The package is not on nuget.org yet; build it from a clone.
  ```

  `NOTE` for context, `TIP` for a better way, `IMPORTANT` for what a reader must not
  miss, `WARNING` for what can break, `CAUTION` for what can lose data or money.
- **Code** is fenced with a language the site highlights: bash (sh, shell, zsh),
  console, powershell, csharp (cs), python (py), typescript (ts), tsx, javascript
  (js), json, jsonc, yaml (yml), toml, ini, dotenv, xml, html, css, sql, dockerfile,
  makefile, diff, markdown, text. A title goes after the language:
  ```` ```bash title="Run the server" ````. Anything else renders as plain text.
- **Tables** keep cells short. A table with a cell over 60 characters stacks into
  labelled cards on a phone, so put long evidence in prose under the table. A
  `Status` column of `works`, `partial` or `not yet` gets a shape beside the word.
- **Links** to another page are relative (`quickstart.md#install`) and stay on the
  site. Links to any other file in the repository are relative to the docs directory
  (`../../src/Server.cs`) and go to GitHub at the pinned commit. A link that climbs
  out of the repository fails the check.
- No `TODO` anywhere, and no relative ages ("3 days ago"): a static page cannot know
  when it is read, and the site's build check rejects the phrase.

## Writing

- Second person and present tense for instructions: "Run", "You get", not "we will".
- Every claim is checkable in the repository: name the file, test or ADR it comes
  from. A number with no source does not go in.
- Say what does not exist yet, plainly. A page that marks what is missing is the one a
  reader trusts about what is there.
- One idea per paragraph, short sentences. Copy the words the code and CLI use.

## Getting it onto the site

After the docs are merged in the project's repository, from this repository:

```bash
npm run docs:pull -- <slug> main --repo Egoushka/<repo> --path docs/guide   # the first time
npm run docs:pull -- <slug>                                                # every time after
```

The pull pins the commit in `content/docs/sources.json`; `npm run docs:verify` fails
if the copy and the commit ever disagree. Never edit the copy here.
