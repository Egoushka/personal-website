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

⚠️ **The `LISTMONK_smtp__0__*` env vars in `compose.yaml` do not configure SMTP.**
listmonk keeps its SMTP blocks in the Postgres `settings` table, and the DB wins. A
fresh install ships two stock blocks — `smtp.yoursite.com:25` (enabled) and
`smtp.gmail.com:465` (disabled) — and it will keep using those no matter what the
environment says. Symptom when this bites: `dial tcp 142.251.127.108:465: i/o timeout`,
a Google address, from a container whose env clearly reads `smtp.resend.com`.

The secret still belongs in SOPS — that is where the DB gets written *from*, and it
keeps the key out of git:

```bash
cd /opt/stacks
make secret-set STACK=listmonk KEY=LISTMONK_SMTP_PASSWORD VALUE=re_your_api_key
```

Commit `listmonk/.env.enc`, never `listmonk/.env`. Adding a *new* key name means
`make inventory` too — CI fails on a stale `SECRETS.md`.

Then apply it to the settings listmonk actually reads. Either **Settings → SMTP** in
the admin UI, or straight into the DB, sourcing the password from `.env` so it is
never retyped:

```bash
cd /opt/stacks/listmonk
PW=$(grep '^LISTMONK_SMTP_PASSWORD=' .env | cut -d= -f2-)
docker compose exec -T listmonk-db psql -U listmonk -d listmonk <<SQL
\set pw '$PW'
update settings set value = jsonb_set(
  jsonb_set(value, '{0}', value->0 || jsonb_build_object(
    'enabled', true, 'host', 'smtp.resend.com', 'port', 587,
    'auth_protocol', 'login', 'username', 'resend', 'password', :'pw',
    'tls_type', 'STARTTLS', 'tls_skip_verify', false)),
  '{1,enabled}', 'false'::jsonb)
where key = 'smtp';
SQL
docker compose restart listmonk
```

STARTTLS on 587. Port 465 needs `tls_type` `TLS` instead — but Hetzner and Resend are
both happy on 587, so there is no reason to.

**Three more stock values bite on a fresh install.** `app.root_url` defaults to
`http://localhost:9000`, which is what every unsubscribe and view-in-browser link in a
campaign is built from; `app.from_email` defaults to a malformed
`listmonk < address >`; `app.site_name` is `Mailing list`.

```bash
docker compose exec -T listmonk-db psql -U listmonk -d listmonk -c \
  "update settings set value = to_jsonb('https://hrabovskyi.online'::text) where key='app.root_url';"
```

Same shape for `app.from_email` (`Yehor Hrabovskyi <newsletter@hrabovskyi.online>`) and
`app.site_name`. The from-address domain must match the DKIM signing domain or DMARC
fails — see below.

---

## 3. DNS — the part that decides whether mail arrives

Your provider will give you records. All go in **Cloudflare → hrabovskyi.online → DNS**.
All are `TXT` or `CNAME`, none should be proxied.

**SPF** — states which servers may send as your domain. Resend uses a *custom return
path*, so its SPF goes on the `send` subdomain, **not on `@`**:

```
Type: TXT   Name: send   Content: v=spf1 include:amazonses.com ~all
Type: MX    Name: send   Content: feedback-smtp.eu-west-1.amazonses.com   Priority: 10
```

⚠️ **Leave the root SPF alone.** `@` already carries
`v=spf1 include:spf.efwd.registrar-servers.com ~all` for Namecheap inbound forwarding.
Do not add `include:amazonses.com` to it and do not create a second `v=spf1` at `@` —
two SPF records on one hostname is a permanent fail, not a merge. SPF is evaluated
against the envelope sender, which is `send.hrabovskyi.online`, so the root record is
not involved in sending.

**DKIM** — cryptographically signs your mail. Resend gives a `TXT` at
`resend._domainkey` (not a `CNAME`) whose value starts `p=`. It signs with
`d=hrabovskyi.online`, which is what aligns DMARC — via DKIM, not SPF.

**DMARC** — tells receivers what to do when the other two fail. Start permissive:

```
Type: TXT   Name: _dmarc   Content: v=DMARC1; p=none; rua=mailto:egorgrabovskij@gmail.com
```

`p=none` means "don't reject anything, just report". Move to `p=quarantine` once the
reports come back clean — going straight to `p=reject` on a misconfigured domain
silently bins your own mail.

**None of the four are proxied** — MX and TXT cannot be, and the DKIM record must
resolve to its literal value. Grey cloud in Cloudflare.

Finally, set listmonk's default from-address to something `@hrabovskyi.online`
(Settings → General). A `From:` on any other domain does not align with the DKIM
signature and DMARC fails even though DKIM itself passes.

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
