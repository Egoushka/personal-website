# SMTP for listmonk — setup guide

~30 minutes, most of it waiting for DNS. Everything on the server side is already
wired; what's missing is an account and four values.

**Do not skip the DNS section.** Sending mail without SPF/DKIM/DMARC from a fresh
domain lands in spam essentially every time, and the damage is slow to undo.

---

## 1. Pick a provider

listmonk has **no mail server of its own** — it hands messages to one. And you cannot
send directly from the VPS: Hetzner address space has no sending reputation, no
warm-up history, and is widely filtered. That is not a configuration you can fix.

Rough shape of the options (check current pricing yourself — these move):

| | Notes |
|---|---|
| **Resend** | Developer-focused, generous free tier, clean DNS setup. Easiest start. |
| **Amazon SES** | Cheapest at volume by a wide margin. Starts *sandboxed* — you must request production access, which takes a day or so. |
| **Postmark** | Best deliverability reputation, priced accordingly. |
| **Mailgun / Brevo** | Fine. Free tiers with volume caps. |

For a newsletter with no subscribers yet, take whichever has the least friction. You
are not optimising cost at zero volume.

---

## 2. Add the four values

The compose file already reads these; they're deliberately optional so an
unconfigured SMTP can't stop the container from starting.

```bash
cd /opt/stacks
make secret-set STACK=listmonk KEY=LISTMONK_SMTP_HOST     VALUE=smtp.resend.com
make secret-set STACK=listmonk KEY=LISTMONK_SMTP_USER     VALUE=resend
make secret-set STACK=listmonk KEY=LISTMONK_SMTP_PASSWORD VALUE=re_your_api_key
make secret-set STACK=listmonk KEY=LISTMONK_SMTP_ENABLED  VALUE=true
```

```bash
cd /opt/stacks/listmonk && docker compose up -d
```

`make secret-set` writes into the SOPS-encrypted `.env.enc`, so the config is in git
without the secret being in git. Commit `listmonk/.env.enc`, never `listmonk/.env`.

Defaults assume **STARTTLS on port 587**. For implicit TLS on 465, change
`tls_type` to `TLS` in `listmonk/compose.yaml`.

---

## 3. DNS — the part that decides whether mail arrives

Your provider will give you records. All go in **Cloudflare → hrabovskyi.online → DNS**.
All are `TXT` or `CNAME`, none should be proxied.

**SPF** — states which servers may send as your domain:

```
Type: TXT   Name: @   Content: v=spf1 include:<provider> ~all
```

⚠️ **One SPF record only.** Two `v=spf1` records is a permanent fail, not a merge. If
one already exists, add `include:` to it rather than creating another.

**DKIM** — cryptographically signs your mail. The provider gives you the selector and
key; usually a `CNAME` like `resend._domainkey`.

**DMARC** — tells receivers what to do when the other two fail. Start permissive:

```
Type: TXT   Name: _dmarc   Content: v=DMARC1; p=none; rua=mailto:egorgrabovskij@gmail.com
```

`p=none` means "don't reject anything, just report". Move to `p=quarantine` once the
reports come back clean — going straight to `p=reject` on a misconfigured domain
silently bins your own mail.

---

## 4. Verify before trusting it

listmonk → **Settings → SMTP → Test connection**, then send a real campaign to a Gmail
address you own.

In Gmail open the message → **⋮ → Show original**. You want:

```
SPF:   PASS
DKIM:  PASS
DMARC: PASS
```

Anything else means DNS hasn't propagated (wait) or a record is wrong (fix it). Do not
send to a real list until all three pass.

Also worth a run through <https://www.mail-tester.com> — it scores the message and
names what's missing.

---

## 5. Then, in listmonk

1. **Lists** → create one. Note its UUID for the subscribe form.
2. **Campaigns → RSS** → point at `https://hrabovskyi.online/feed.xml` if you want
   posts to go out automatically. This is the setup worth having: the newsletter
   becomes a derivative of the feed rather than a second thing to write.
3. The subscribe form is **deliberately not on the site yet** — `/subscription/form`
   is routed and reachable, but nothing links to it. A signup box on a two-post blog
   converts nobody. Wire it in when there's a reason to subscribe.

---

## Where things are

- Dashboard: `https://listmonk.lab.hrabovskyi.online` — **tailnet only**, not public.
- Public paths: `/subscription/*` on the main site, nothing else.
- Admin credentials: `listmonk/.env` on the box (SOPS-encrypted at rest in `.env.enc`).
