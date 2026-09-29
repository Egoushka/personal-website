---
title: "Pin a dependency to a commit, and fail when the copy differs"
description: "Three of my projects name what they depend on by an exact commit or version, and a check fails when it drifts. The price is a chore that goes stale."
lastReviewed: "2026-09-29"
projects: ["agent-skills", "chargehand", "chronicle"]
posts: []
topics: ["ci-cd", "mcp"]
---

## Name the exact thing, and check that you still have it

Something that someone else can edit will change under me without a sound. So I write down the exact commit or version I read, not a name like "latest", and I add a check that fails when what I have stops matching what I wrote down. An update then happens because I chose it, with the changes in front of me, and not because a rebuild pulled something new.

## Three projects that pin

[agent-skills](/projects/agent-skills/) treats other people's agent skills the way a lockfile treats packages. Each one is copied byte for byte from its upstream repository at a commit recorded in `vendor.json`, and CI runs `vendor.py verify`, which fails when any copy differs from that commit, apart from patches that are written down ([how it works](/projects/agent-skills/docs/vendor-a-skill/), [the decision](https://github.com/Egoushka/agent-skills/blob/84211d1f7fcb0f93f34c850bf9e306a2d0ba68f4/docs/adr/0002-vendor-and-pin-community-skills.md?plain=1#L12-L13)). A weekly job moves the pins and opens one pull request for me to read.

[chargehand](/projects/chargehand/) pins in two places. A request names a repository and a commit, the worker reads a clone at exactly that commit, and every citation in an answer is checked against it; a claim that does not resolve is moved to open questions instead of being reported ([README](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/README.md?plain=1#L64-L66), [what is tested](/projects/chargehand/docs/capabilities/)). It also pins the version of each agent program it drives, and a different version stops the run with `runtime_version_mismatch` ([reference](https://github.com/Egoushka/chargehand/blob/b5668901da66b01d828a4263fa8f7d7c03f78191/docs/guide/reference.md?plain=1#L105)).

[Chronicle](/projects/chronicle/) pins a range, not a commit, and learned why. A rebuild without the pin pulled a new major version of the MCP library, which had removed what the server imports, and the container crash-looped. The Dockerfile and `pyproject.toml` now both say `mcp>=2.2,<3`, and a test fails if the two ever differ ([Dockerfile](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/Dockerfile.mcp?plain=1#L6-L12), [test](https://github.com/Egoushka/chronicle/blob/741dbb1f5ec6ce64fd9d45df6d647b45f062e8ac/tests/test_mcp_server.py?plain=1#L27-L33)).

This site does the same to the docs it shows for each project: a copy at a pinned commit, and `npm run docs:verify` fails when one byte differs ([the decision](https://github.com/Egoushka/personal-website/blob/dceb85b36e604118c23e12866c4f4e7178536cb3/docs/adr/0006-docs-are-written-where-the-code-is.md?plain=1#L28-L29)).

## A pin is a chore I have to keep doing

A pin does not update itself. The first pull request from agent-skills' weekly job carried twelve updates and was opened on 2026-09-28. It was still unmerged when I reviewed this page ([the pull request](https://github.com/Egoushka/agent-skills/pull/1)). The project's own decision record names the cost: every change gets read once, and upstream fixes arrive up to a week late ([ADR 0002](https://github.com/Egoushka/agent-skills/blob/84211d1f7fcb0f93f34c850bf9e306a2d0ba68f4/docs/adr/0002-vendor-and-pin-community-skills.md?plain=1#L21-L22)).

A pin also turns a quiet change into a loud failure. If the agent program on a machine updates itself, chargehand refuses to run until I install the pinned version or say which one I run. That is the point, and it is still a stopped run.

## When I break it

I do not pin the plugins I take from publishers. agent-skills lists them in `publishers.json` with an install command that names no commit, because they ship hooks and servers that copying their skills would lose ([the list](https://github.com/Egoushka/agent-skills/blob/84211d1f7fcb0f93f34c850bf9e306a2d0ba68f4/publishers.json?plain=1#L10)). Its own default install command names the repository, not a commit; you get a fixed commit only by asking for a tree URL ([quickstart](https://github.com/Egoushka/agent-skills/blob/84211d1f7fcb0f93f34c850bf9e306a2d0ba68f4/docs/guide/quickstart.md?plain=1#L20-L22)).

And Chronicle's pin is a range that allows any release below the next major. I chose that on purpose: the next major is work I want to do deliberately. It means a new release inside the range can still change what runs, which a commit would not allow.
