---
title: "chargehand 0.8.0: claims checked against what they cite, results signed"
date: "2026-10-05"
description: "chargehand 0.8.0 checks each claim against the text it cites, signs results with a key you make, and lays the groundwork for workers that write."
kind: note
project: "chargehand"
topics: ["architecture", "mcp"]
---

I released [chargehand](/projects/chargehand/) 0.8.0 as one release for two goals. There is no 0.7.0 because no commit was 0.7-only, as with the missing 0.5.0. The 0.8 goal was to check whether every claim is supported by the text it cites, allow results to be signed with a key the user makes, and let `chargehand verify` check a signed result offline. The 0.7 goal was to let workers write.

I added a support check that runs after a node and uses one call on the intake model to judge whether the cited text supports each claim. The `result/v1` claims gained an optional `support` value: `supported`, `partial`, or `unchecked`. An unsupported claim moves to `open_questions`, while a partly supported claim stays at half confidence and is not kept for memory. A failed support check leaves claims `unchecked` and does not fail a run, and the profile’s `support_check` setting defaults to true and can turn the check off.

On 30 labelled claims, the two evaluated models each agreed with the labels 25 times, matching perfectly on clearly supported and clearly unsupported claims but not partly supported ones. I added signing through a P-256 key supplied by the user in `signing.key_file` or `CHARGEHAND_SIGNING_KEY_FILE`. The optional `result/v1` signature uses ES256 over the RFC 8785 canonical result. `chargehand verify <result.json> --public-key <pem>` and `ResultSignature.Verify` in `Chargehand.Contracts` check signatures offline.

Chargehand does not create or store signing keys. I also made evidence without a `sha256` record the SHA-256 of the whole cited text, taken before any cut for the judge. The writing-worker groundwork is additive, and a preset node kind may set `writes` and `verify` with `timeout_seconds` and `max_fix_rounds`. A writing node’s workspace is designed as a per-run clone of the cached checkout under `<worker_root>/.runs/<run>/<node>`, on a branch named for the run and node.

The worker commits with repository hooks and signing off, while the source repository and shared checkout are never written. The planned sandbox uses `sandbox-exec` on macOS and `bwrap` on Linux, behind one interface. The verifier is designed to run the request’s `context.verify` command or a repository-specific test command in the sandbox, with a timeout and an 8 KiB output tail. The `code` preset is designed as one writer that edits files in its own clone and returns a branch.

It runs the repository’s tests in the sandbox after each answer and sends a failure back to the worker at most twice. It returns a branch, a diff, and a verification artifact describing the command, sandbox, network, exit code, attempts, output tail, and changed build and test paths. The worker-writing usage bars for 0.7 and 0.5—my own use on real tasks—remain open. The Linux sandbox has only been tested as arguments and never run, and the support judge was measured on 30 claims.