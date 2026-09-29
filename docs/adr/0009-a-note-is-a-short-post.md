# A note is a short post, not a new section

Status: accepted

The `/post` skill asks 1,000–1,800 words of a post, and a small true finding — a
gotcha, a number that should not be true, one command whose output was a surprise —
can take four hundred to tell. It had two ways out: wait for company, or be padded
to length. The first does not ship; the second is the voice the post framework
exists to keep out.

So a post can be a `note`: one finding in 300–700 words, the number or the surprise
first, the evidence, and what it does not tell you (docs/writing/README.md). It is a
fourth kind beside `finding`, `incident` and `build`, not a new kind of page: the
same frontmatter, the same evidence pack and the same validator, which warns past
800 words that it has outgrown the kind.

**The same addresses.** A note lives at `/writing/<slug>/`. Slugs are one namespace
and never change once published, so a note that outgrows the kind, or a post that
turns out to be one small finding, changes its `kind` and keeps its URL. A route of
its own, `/notes/<slug>/`, would make the kind part of the address and every
reclassification a redirect in the Caddyfile. The notes on their own are a list at
`/notes/`, outside `/writing/`: at `/writing/notes/` the list would take the slug
"notes" from every future post.

**The same feeds.** A subscriber asked for the writing, and a note is writing. A
second feed would split a small readership in two and make each reader work out
which one they wanted. Every item already carries its topics as categories; a note
adds its kind, "Note", so a reader can tell it apart or filter it out. The lists
and a note's own page label it the same way.

The cost accepted: length does not make a note, so the label has to. One of the
build posts is already inside a note's range and stays a build, because it is about
a shape and not a finding; the index sets both beside thousand-word findings. A note
owes the whole evidence pack, so it is shorter to write and no cheaper to check. And
`/notes/` is `noindex` and out of the sitemap until it lists two, like a topic hub:
until then the list is reached from `/writing/`, not from a search.
