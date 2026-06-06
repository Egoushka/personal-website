---
title: "Running a homelab on one VPS"
date: "2026-06-06"
description: "Tailscale, Caddy, Vaultwarden and GitOps on a single Hetzner box — how my homelab is wired together."
tags: ["infrastructure", "self-hosting"]
---

My homelab is one Hetzner VPS in Helsinki. No rack, no Raspberry Pi cluster — just a single Ubuntu box I run like a tiny production environment. The goal was never to save money. It was to learn infrastructure the way you only learn it when you're the one who gets paged.

## The constraints I gave myself

- **Private by default.** Nothing internal is exposed to the public internet — admin surfaces live behind a VPN.
- **Reproducible.** Config is version-controlled and encrypted, so I can rebuild from git rather than from memory.
- **Real HTTPS everywhere**, including internal-only services.

## The networking layer

Connectivity runs over **Tailscale**, but with a **self-hosted Headscale** control plane instead of the SaaS. That gives me a private mesh between my devices and the VPS, with `MagicDNS` and a stable internal address space. DNS on the tailnet is handled by **AdGuard Home**, which also filters ads and trackers network-wide.

## The edge

**Caddy** is the reverse proxy. Public services (like this site) get automatic Let's Encrypt certificates; internal services get trusted certs from Caddy's own internal CA, so even tailnet-only tools load over HTTPS without browser warnings. One config file, two trust models.

## Secrets & config

Application secrets live in **Vaultwarden** — a lightweight, Bitwarden-compatible vault I host myself. Infrastructure config is a **GitOps** repo encrypted with **SOPS + age**, so the repository can be public-shaped without leaking anything. The one rule I had to learn the hard way: *back up the age key offline*, or an encrypted repo becomes an encrypted brick.

## What it taught me

The lab keeps giving me problems that a managed platform would have hidden: a DNS outage when I toggled the VPN off on the wrong machine, a container that needed a full recreate to re-map ports, certs that didn't trust until I fixed the system keychain. None of it was glamorous. All of it made me better at the part of the job that happens after the demo.
