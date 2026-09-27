# hrabovskyi.online

The personal site of one engineer. It exists to make a technical stranger trust the
engineering and reach the writing. It is not a product, and it never hosts one.

## Language

### The site and what is outside it

**Site**:
The single statically-exported thing at the apex domain. One repo, one deploy.
_Avoid_: platform, hub, ecosystem

**Product**:
Something with its own users, its own repo, its own runtime and its own subdomain.
Chronicle and Baseline are Products. The Site links to a Product and never contains one.
_Avoid_: app, project (a Product that the Site describes is described *as* a Project)

**Ecosystem**:
Not a thing that exists. Reserved for the day two Products share one real user.
Until then the word names an intention, not a system.

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
