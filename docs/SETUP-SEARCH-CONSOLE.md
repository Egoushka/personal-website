# Search Console + Bing — setup guide

~15 minutes. Do Google first; Bing can import it and skip most of the work.

Why bother: Umami tells you **who visited**. Search Console tells you **what you rank
for, what people searched to find you, and which pages Google refuses to index**.
For an audience-first site that second number is the one that matters, and nothing
else reports it.

---

## 1. Google Search Console

### Choose a Domain property, not a URL prefix

At <https://search.google.com/search-console> → **Add property**, pick the **left**
box (*Domain*), enter `hrabovskyi.online`.

This matters. A Domain property covers `http`, `https`, `www` and every subdomain in
one place. The URL-prefix alternative verifies by uploading an HTML file — which a
static export wipes on every deploy unless it lives in `public/`. DNS verification
survives deploys, rebuilds and host moves.

### Verify by DNS

Google gives you a TXT record like:

```
google-site-verification=AbCdEf...
```

In Cloudflare → **hrabovskyi.online** → **DNS** → **Add record**:

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `@` |
| Content | `google-site-verification=…` (the whole string) |
| TTL | Auto |

Proxy status is irrelevant for TXT. Click **Verify** in Search Console — usually
instant, occasionally a few minutes.

### Then, in order

1. **Sitemaps** → submit `sitemap.xml`. It already lists every page, with real content
   dates rather than build time.
2. **URL Inspection** → paste `https://hrabovskyi.online/` → **Request indexing**.
   Repeat for each post. This is the fastest way onto the index from a standing start.
3. Come back in **3–7 days**. There is no data before then, and that is normal.

### What to actually look at, once there is data

- **Performance → Queries** — the real one. What people typed to reach you. If a query
  shows impressions but no clicks, the title or description is losing the click, and
  both are one edit away in the post's frontmatter.
- **Pages → Why pages aren't indexed** — "Discovered – currently not indexed" on a new
  site is normal and means *wait*. "Crawled – currently not indexed" means Google
  looked and decided it wasn't worth it, which is a content signal.
- **Core Web Vitals** — needs real traffic before it reports anything.

---

## 2. Bing Webmaster Tools

<https://www.bing.com/webmasters> → **Import from Google Search Console**. It carries
the verification and the sitemap across, so this is genuinely a two-minute job.

If you'd rather not connect the accounts, add a second Cloudflare TXT record with the
`BingSiteAuth` value it offers instead.

Worth doing despite Bing's share: **it feeds ChatGPT and Copilot's search results.**
For a site whose posts are the point, that's a real distribution channel.

### IndexNow

Bing supports [IndexNow](https://www.bing.com/indexnow) — you push a URL and it
crawls within minutes rather than whenever it next feels like it. If you want that
wired into the deploy, say so; it's one `curl` in the workflow after the verify step.

---

## Checks

```bash
# TXT records live?
dig +short TXT hrabovskyi.online

# sitemap reachable and current?
curl -sS https://hrabovskyi.online/sitemap.xml | grep -c '<loc>'
```

Verification is a **one-time** step. Once the TXT record is in Cloudflare, leave it —
removing it un-verifies the property and you lose the history.
