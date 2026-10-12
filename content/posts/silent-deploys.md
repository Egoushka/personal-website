---
title: "The deploy said success. Nothing had deployed for 51 days."
date: "2026-07-28"
description: "A pipeline that reported success while shipping nothing, a config the container could never see, and one shared cause: failure that looks like success."
kind: incident
project: "homelab-gitops"
topics: ["infrastructure", "debugging", "ci-cd"]
spanDays: 51
updated: "2026-09-29"
correction: "The terminal output shows 203.0.113.10, a reserved documentation address, as if it were the real one; it is a placeholder swapped in for the real address, and the post now says so. An on-box path and container name were also replaced with generic terms."
---

I went to add a security header to this site and found that the last successful deploy had been fifty-one days earlier. Not a failed deploy. Not a red X in the Actions tab. Nothing at all — the pipeline had simply stopped being invoked, and no one, including me, had noticed.

That turned out to be the first of three separate bugs, each with the same shape: **the failure state was indistinguishable from the success state.** Green check, no error, nothing shipped.

## The address that answered but didn't listen

The deploy workflow pushed to a hardcoded IP:

```yaml
env:
  VPS_HOST: 203.0.113.10
```

The address in this post, `203.0.113.10`, is a placeholder swapped in for the real one; the output below is shown with it.

The box had since moved to a different address. The workflow still pointed at the old one — and here is the part that made it invisible: **that IP still answered.**

```
$ ping -c 2 203.0.113.10
2 packets transmitted, 2 packets received, 0.0% packet loss

$ nc -z 203.0.113.10 22
port 22 CLOSED
```

Something is still at that address. It replies to ICMP. It just doesn't accept SSH any more. Every casual check — *is the server up?* — says yes.

The tell wasn't in the infrastructure at all, it was in the timestamps:

```
last successful Actions run   2026-06-06T23:58Z
site/index.html on the box    Jun  6 23:58
```

Byte-identical. The last deploy that ran and the newest file in production were the same event. Fifty-one days of commits, and the live site had never seen one of them.

There was also a `workflow_dispatch` run sitting in **queued** state for 1,229 hours. Not failed. Queued. A run that never starts never turns red.

## A config file the container could never see

Fixed the address, redeployed, added security headers to the Caddyfile. The deploy reported success. The headers didn't appear.

The Caddyfile is mounted into the container as a single file:

```yaml
volumes:
  - ./Caddyfile:/etc/caddy/Caddyfile:ro
```

That looks harmless. It isn't, and the reason is that **a bind mount of a file binds an inode, not a path.**

`rsync` — like most tools that care about atomicity — doesn't write into the existing file. It writes a temporary file next to it and renames it over the top. The rename is atomic, which is exactly why it's the default behaviour. It also produces a *new inode*. The host path now points at that new inode; the container's mount is still pinned to the old one.

So the host has the new config. The container has the old config. Both are real files. Neither tool is wrong. And nothing anywhere reports an error:

```
$ grep -c "Content-Security-Policy" <stack-dir>/Caddyfile
1
$ docker exec <container> grep -c "Content-Security-Policy" /etc/caddy/Caddyfile
0
```

The fix is one flag:

```bash
rsync -avz --inplace deploy/Caddyfile "$VPS:$REMOTE_DIR/"
```

`--inplace` writes through the existing inode instead of replacing it. You give up rsync's atomicity, which for a config file you're about to reload is a trade worth making.

## The reload that wasn't

Same deploy, one layer down. The workflow ended with:

```bash
docker compose up -d
```

Which is the incantation everyone reaches for, and which does nothing here. `up -d` is *declarative*: it compares the desired state in your compose file against the running containers and reconciles the difference. If the compose spec hasn't changed, there is no difference. The container is not recreated. Caddy is never told to re-read anything.

The command exits 0. It even prints something reassuring:

```
Container <container>  Running
```

"Running" is not "restarted". So the deploy step succeeded, the container was healthy, and the config was still the old one. Three green signals, zero effect.

```bash
docker compose up -d && \
  docker exec <container> caddy reload --config /etc/caddy/Caddyfile
```

The explicit reload has a second benefit: `caddy reload` validates the config and exits non-zero if it's broken. It converts a silent no-op into a loud failure — which is the whole point.

## The thing these have in common

None of these were subtle bugs. Each one is obvious in hindsight and takes one line to fix. What made them survive was that **every observable signal said things were fine.**

- The old IP answered pings.
- The queued run never went red.
- `rsync` exited 0 and had genuinely copied the file.
- `docker compose up -d` exited 0 and the container was genuinely running.

Not one of those is a lie. They're all true statements about something *adjacent* to the thing I actually cared about. Ping proves a host answers ICMP, not that it accepts SSH. rsync exiting 0 proves bytes reached the host, not that a process can see them. `up -d` succeeding proves the desired state is reconciled, not that a config was re-read.

The habit I'm trying to build from this is to make the check assert the *outcome*, not the step. So the deploy now ends with:

```yaml
- name: Verify the site is serving
  run: |
    for path in / /blog/ /feed.xml; do
      code=$(curl -sS -o /dev/null -w '%{http_code}' "https://hrabovskyi.online$path")
      echo "$path -> $code"
      [ "$code" = "200" ] || exit 1
    done
```

It doesn't check that rsync ran. It checks that the site is up and serving the pages it should. That assertion would have caught all three bugs, because all three ended in the same place: the thing I wanted to be true wasn't.

I built the same lab this deploys to [on a single VPS](/writing/homelab/), largely to learn this class of problem in a place where the only person I page is me. This is exactly the lesson it exists to teach — and it still took fifty-one days to notice.

The uncomfortable part isn't that the pipeline broke. Pipelines break. It's that a broken pipeline and a working one looked identical from the outside for seven weeks, and the only reason I found out was that I happened to go looking for something else.
