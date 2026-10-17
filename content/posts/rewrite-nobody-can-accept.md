---
title: "My prompt enhancer's acceptance rate is zero, by design"
date: "2026-10-17"
description: "chargehand asks whetstone for a better prompt on every run and sends the original anyway: a run started over an API has nobody to accept a rewrite."
kind: note
project: "chargehand"
topics: ["architecture", "mcp"]
---

[chargehand](/projects/chargehand/) can ask a prompt enhancer for a better version of each request, and then it sends the original anyway, on every run that has an enhancer configured. The feedback it reports counts each offered rewrite as not accepted, so the enhancer's acceptance rate from chargehand is zero by construction.

The enhancer is whetstone, a separate tool that keeps my past prompts and what happened after them. chargehand got the seam for it on 4 October (ADR 0040) and learned to call it in the run path on 5 October (ADR 0041). I wanted whetstone running on real prompts, and chargehand runs were the prompts I had.

The rule is one line of ADR 0041, at chargehand commit `17bcaf2`:

> The text sent is the request's text, unchanged, in every run

The reason is who sits on the other end. A chargehand run can start over HTTP, over MCP or from a script, and then nobody is there to read a rewrite. If chargehand swapped the prompt, the caller would get an answer to a question it never asked, and nothing in the result would say so. So a rewrite leaves one mark, a tag on the run, and never its text (`src/Chargehand/Orchestrator.cs`):

```csharp
run?.SetTag("chargehand.enhancer.rewrite_offered", answer.Changed);
```

A guard wraps the call as well. When whetstone is late (1,500 ms by default), fails, or returns the same text, the run goes on as if nobody had asked.

Nine days later I wrote a Claude Code hook with the opposite rule. Prompts that pass its filters (length, no credentials, no work repositories) go to Haiku, and when the edit passes checks in plain code (0.8 to 1.4 times the original length, every path and number intact, the same script), the agent gets the edit. I can't veto an edit before it goes, but I sit at the keyboard: the hook prints why it edited, a `*` at the start of a prompt skips it, and `/prompt-edits` shows each original next to what went out. That is what separates the two rules: a person who can switch the edit off and read it afterwards.

## What the zero does not tell you

It says nothing about whether whetstone's rewrites are any good, and today it could not. whetstone is a pass-through that remembers: with retrieval off, its default, it answers `enhance` with the prompt unchanged, so no rewrite is offered at all. The first acceptance number worth reading needs one of the two things ADR 0041 names for reopening the decision: a client that shows a rewrite to a person and lets them take it, or a caller that opts in to rewrites on its own runs.
