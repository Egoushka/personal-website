---
title: "My private services were on the public internet. DNS was the only thing hiding them."
date: "2026-09-29"
description: "Every internal service on my homelab answered 200 to the open internet. The tailnet addresses in DNS looked like access control. They were a suggestion."
topics: ["infrastructure", "self-hosting", "debugging"]
---

I was tidying up a blog post that had a server IP in it — a stale one, no longer mine, but still not something worth publishing. While I was there I decided to check the obvious follow-up question: is the *current* address exposed anywhere?

It isn't. The problem was what the box served to anyone who had it.

## The setup that felt safe

Every internal service on my box lived on a `.lab` subdomain. Forgejo at `git.lab`, the analytics dashboard, the reverse-proxy admin, the file-sharing app. Each one resolved to my tailnet address:

```
$ dig +short git.lab.hrabovskyi.online
100.64.0.2
```

`100.64.0.0/10` is carrier-grade NAT space. It isn't routable from the internet. If you type `git.lab.hrabovskyi.online` into a browser without being on my VPN, you get nothing, because the address you resolve goes nowhere that's mine.

That's the mental model I'd been running on for months. Private DNS, private addresses, private services. It's tidy, it needs no auth layer, and it *feels* like a boundary.

## The one hostname that has to be public

My tailnet uses a self-hosted control plane, and the control plane has to be reachable from wherever my devices happen to be — a café, a phone on mobile data, a machine that isn't on the VPN yet. So one hostname resolves straight to the box:

```
$ dig +short headscale.hrabovskyi.online
<the origin address>
```

That record is public on purpose. It also puts the server's real address one `dig` away for anyone who looks, and no amount of proxying the *other* names changes that.

I'd always known this and filed it as harmless. The services are on tailnet addresses, so what does knowing the box's IP get you?

## What it gets you

```
$ curl -s -o /dev/null -w '%{http_code}\n' \
       --resolve git.lab.hrabovskyi.online:443:<origin> \
       https://git.lab.hrabovskyi.online/
200
```

That's from a machine with no VPN, no credentials, nothing. `--resolve` just tells curl to skip DNS and connect to an address I picked, while still sending the original hostname.

Four services. Four `200`s. My git server — holding the source for every stack I run, including the config for the box itself — served its login page to the open internet on request.

The reverse proxy listens on `0.0.0.0:443`. It accepts any connection that reaches the machine, reads the `Host` header out of the request, and matches it against its routing table. That's all a virtual host is. It never consults DNS, because it doesn't need to — the client already did the resolving, and the client is free to lie about it.

So the tailnet addresses in my DNS were a **convention**: a way for *my* machines to find the services. Anyone willing to skip the lookup and assert the hostname themselves walked straight in.

The same thing was true of the public site, in a different shape. It sits behind a CDN with a firewall, bot rules and rate limiting — none of which does anything if you connect to the origin directly, which also answered `200`.

## Why nothing ever looked wrong

Every day, all my own traffic behaved as designed. On the VPN, `.lab` resolved to the tailnet and worked. Off the VPN, it resolved to an unroutable address and failed. The system produced a perfect demonstration of the boundary I believed in, on demand, every time I tested it.

But I was only ever testing the *front door* — the path a well-behaved client takes. The failure I cared about needed a client that ignored DNS entirely, and there was no reason for me to ever be that client on my own infrastructure.

## The fix

Allow-lists on the proxy, split by what each route is for. Internal routes accept the tailnet and private ranges only. The public site accepts the CDN's published ranges only, since if the zone is proxied then legitimate traffic can't arrive from anywhere else by definition — anything hitting the origin directly is bypassing the protections in front of it.

The control-plane route stays open, deliberately. Clients connect from arbitrary addresses; restricting it would break the thing it exists to do.

The same requests, run again after the change:

```
.lab from the internet    403   (was 200)
.lab from the tailnet     200
public site via CDN       200
public site direct        403   (was 200)
```

I chose proxy middleware over a host firewall on purpose. The box exposes a handful of TCP ports and several UDP ones — VPN, WireGuard, other things — across a hundred-odd containers. A default-deny network firewall means enumerating all of that correctly, and getting it wrong means locking myself out of the machine. The middleware is precisely scoped and reverts in seconds.

The proxy returns `403` *after* accepting the connection and completing the TLS handshake. The port is still open; the applications behind it are no longer reachable. That's the fix for "my git server is on the internet." It is not the fix for "my server is visible."

## What I got wrong

Not the architecture. Tailnet-addressed internal services are a good pattern and I'd build it the same way again.

What I got wrong was treating a **naming** decision as an **access** decision. DNS answers "where is this?" It has never answered "may you?" — and a request that arrives with the right `Host` header has already skipped the only step where DNS had any say.

I'd internalised "these are on the tailnet" as a property of the services. It was a property of *how I reached them*. Those are not the same sentence, and the gap between them was four services and a `curl` flag.

I run this lab [on a single VPS](/writing/homelab/) specifically to make mistakes like this somewhere the only person who gets paged is me. That worked exactly as intended. But it was the second time in two days that the interesting bug was [a working thing that was never doing what I assumed](/writing/silent-deploys/), and I only found it because I went looking for something else entirely.

I'm starting to think that's not a coincidence. The bugs that survive are the ones your habits can't reach.
