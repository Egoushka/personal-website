# Keep the computed figures, drop the ledger

Status: accepted

The site was built around a double-entry trial balance: eight Claims about the owner,
each set against a counted Reading, with a balance column, an `--open` colour for rows
that do not meet, and an expiry after which a row is struck through in public. Two
rules were tangled together inside it. The first — **no figure is typed by hand if the
build can count it** — is the best idea in the repo and is kept, unchanged. The second
— that the site should present itself as a set of audited assertions — is dropped.

Why: the accounting register is not the owner's voice, and a voice he cannot sustain
is why the site went two full redesigns without a post. The site is being rewritten in
a plainer, warmer register; computed figures survive into it and matter more there, not
less, because they are what stops an informal voice reading as an unserious one.

Consequence, and it is the non-obvious one: **the expiry and strike-through mechanism
goes with the metaphor, not with the rule.** There is deliberately no publishing
cadence and no success criterion for this site — the owner goes at his own pace. A
machine that renders its own staleness in public, owned by someone who has declined to
commit to a cadence, is a machine guaranteed to advertise abandonment. Figures are
counted fresh at every build; nothing is scored against a deadline.
