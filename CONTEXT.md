# hrabovskyi.online

The personal site of one engineer. It exists to make a technical stranger trust the
engineering and reach the writing. It may also be an application and host offers ([ADR 0011](docs/adr/0011-the-site-may-be-an-app.md)).

## Language

### The site and what is outside it

**Site**:
The single thing at the apex domain. One repo, one deploy. Public pages are statically exported; `/api` and `/admin` may run on a server.
It may be the hub that links Products and hosts offers.
_Avoid_: platform

**Product**:
Something with its own users, its own repo, its own runtime and its own subdomain.
Chronicle and Baseline are Products. The Site links to a Product; it may also host an offer.
_Avoid_: app, project (a Product that the Site describes is described *as* a Project)

**Ecosystem**:
The Site and the Products around it, taken together. Lifted by ADR 0011: it is a word like any other now.

### Content

**Post**:
A piece of published writing with a date. The unit the Site is judged by.
_Avoid_: article, blog entry, entry

**Draft**:
Writing that is not a Post. It is in the repository and it is not on the Site.
Promoting a Draft to a Post is a deliberate, reviewed act, never an automatic one.
_Avoid_: unpublished post, WIP

**Project**:
The Site's description of something built — a Product, or a piece of work with no
users. A Project is a page about a thing; the thing itself is elsewhere.
_Avoid_: work, portfolio item

**Method**:
A rule for how the owner works that two or more Projects follow the same way, with
where it came from, what it costs and when he breaks it. Reviewed, never dated.
_Avoid_: principle, value, best practice, manifesto

**Job**:
One paid role in the employment record. Feeds both the Site and the CV.
_Avoid_: position, experience (that is the collection, not the item)

**CV**:
The one-page printable record of Jobs and Education, generated from the same data
the Site renders.
_Avoid_: résumé, resume — pick one word and this is it

### Taxonomy

**Topic**:
One entry in the site's single closed vocabulary — `kubernetes`, `dotnet`,
`observability`. A Post, a Project and a Job all reference Topics by slug, which is
what lets one Topic gather everything about it onto one page.
_Avoid_: tag, skill, technology, category — all three of those were separate
vocabularies and the split was the bug

### Figures

**Reading**:
A number the build counts rather than a person types — post count, word count,
reading time, lines of source. A figure that cannot be counted is not a Reading and
must name its source.
_Avoid_: stat, metric, number

**Claim** *(retired)*:
An assertion about the owner set against a Reading, printed as a row of a double-entry
trial balance. The structure the Site was built around until 2026-08; it has been
removed. The word stays here so the term is recognised in git history, not reused.
