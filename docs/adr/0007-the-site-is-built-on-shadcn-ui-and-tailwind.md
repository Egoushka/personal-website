# The site is built on shadcn/ui and Tailwind CSS

Status: accepted. Replaces the design brief's "one hand-written stylesheet, no
Tailwind" rule.

For three designs the site kept one hand-written stylesheet: every size, gap and
column chosen by hand and justified in a comment. It stayed correct and it stayed
narrow. The page grid was a 168px rail beside a 640px column at every width, so on a
1440px screen every page — the writing, the projects, and from September a project's
docs — was the same column with a metadata strip beside it, and docs read like blog
posts. The owner asked for an existing design system rather than more hand-tuned pixels.

We build the site on **shadcn/ui on Tailwind CSS v4**:

- The tokens are shadcn/ui's (`background`, `foreground`, `card`, `muted`, `border`,
  `input`, `ring` …) plus `brand`, the amber that means link, current and focus. They
  carry the palette the site already had, and its computed contrast floors.
- Pages are composed from Tailwind utilities and shadcn/ui components — button, badge,
  card, breadcrumb, kbd — copied into `components/ui/` as shadcn/ui intends, so they
  are source files here and not a dependency.
- Rendered markdown (posts and docs) is `@tailwindcss/typography` under `.markdown`.
- Pages run to 80rem, the docs to 90rem, where the docs have a sidebar, the page and
  its contents side by side.

Why this and not another: it is the design system most documentation and product
sites on this stack use, including the docs frameworks built for Next.js, so the look
comes from conventions that exist rather than ones invented here. It adds no runtime:
Tailwind compiles to the one static stylesheet the export and the CSP already allow.
Its tokens are CSS variables, so light and dark stay a token swap. Radix Themes would
put a React provider and its runtime on every page; a docs framework (Fumadocs, Nextra)
would bring a second layout system and a second search beside Pagefind; token sets
alone (Open Props, Radix Colors) would leave every component to be drawn by hand again.

What stays as it was: the static export, the CSP, the rule that every client component
is justified, and each control's accessibility contract (`input` is the 3:1 control
edge, `border` is decorative). No Radix primitives: every shadcn/ui component used here
is markup and classes, and one that needs a primitive must earn its client component
like any other. Client components use no `cn()` or `cva`: tailwind-merge would ship to
every visitor for a few class names. Component CSS remains in `app/globals.css` only
where utilities would read worse than a stylesheet — markdown, code blocks, tables, the
contents list, search results, the home panel's figures, the skills board, the journey
chart, and the CV's A4 print sheet.

The cost accepted: markup carries long utility strings where it used to carry one class
name; Tailwind and the typography plugin are build dependencies to keep current; and the
typography plugin emits its rules in a later cascade layer than `components`, so the
markdown overrides are unlayered, which globals.css says where it happens.
