# Redesign mockups: from CV to shop and partnerships

Three directions, one information architecture: Home (one line, three doors, live numbers), Shop, Partner, Writing, Lab. Static HTML and CSS only, no site code touched. Data is real, read 2026-11-11 from the live site and `/status.json` (133 containers, 0 unhealthy, Attest 1.2.1 with 662 downloads, 12 posts, 19 projects). The products are placeholders marked "coming" or "building"; prices are not set, so none are shown.

Open `<direction>/index.html`. Each folder has `index`, `index-dark`, `shop`, `partner`, `writing`, `lab` as `.html` plus `-desktop.png` (1440) and `-mobile.png` (390), full page. Fonts are system stacks only. Regenerate nothing: the files are the source.

| | `ledger/` | `window/` | `editorial/` |
|---|---|---|---|
| Idea | A bookkeeper's page: rows and rules, every number a line item | A shop window: soft cards, one blue accent, product-first | A magazine: huge serif headline, numbered doors, quiet rules |
| Type | Monospace | Sans | Serif display, sans labels |
| Colour | Warm paper, ink, green accent | Cool grey, white cards, indigo accent | Off-white, black, vermilion accent |
| Shop | Two-column ledger rows: description left, price model and usage right | Card grid, free/paid chips, usage in a tinted pill | Full-width rows, large product names, status as a dot |
| Honesty cue | Reads like accounts: "0 paying users" sits in a row | Usage pill on every card | Evidence line under each entry |
| Fit with today's site | Closest: keeps the evidence-first feel | Furthest: looks like a typical SaaS | Medium: keeps the writing as the hero |
| Risk | Dense and cold for non-engineers | Generic; "shop" cues may read as nagging to buy | Big type costs mobile height; serif may feel slow for tools |
| Best if | Trust with engineers matters most | Visitors should convert on products | Writing stays the main draw |

Shared rules encoded: the Shop links out to `<product>.hrabovskyi.online` and hosts nothing; free essentials stated before paid; no "buy" nagging; 44 px targets; light first, dark variant of Home. Not done: the style-tile board and axe-core run from the ui-design skill were skipped for this exploratory round.
