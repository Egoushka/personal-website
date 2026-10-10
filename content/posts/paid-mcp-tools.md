---
title: "HTTP 402 waited 29 years for a payer. An AI agent fits."
date: "2026-10-10"
description: "Paid MCP tool calls in .NET over x402: an AI agent pays per call in USDC, never for a call that failed. The market it serves is about $28,000 a day."
kind: build
project: "x402-mcp-dotnet"
topics: ["mcp", "dotnet"]
---

I was scrolling Reels when a video explained HTTP status 402, and I started looking it up right away.

The HTTP/1.1 specification of January 1997 lists status 402, Payment Required, with one line under it: "This code is reserved for future use." The current specification, from June 2022, says the same. For 29 years the web had no payer that could answer a 402 by itself. A person will not type a card number to read one page.

An AI agent with a wallet can. x402, a protocol started by Coinbase, gives the code a job: the server answers 402 with a price, the client signs a payment in USDC, a dollar stablecoin, and sends the request again. Agents call their tools through MCP, the Model Context Protocol, and x402 defines how a payment rides on an MCP tool call.

I was amazed. It looked like a genuine solution, and the decentralization would be amazing for the internet. The idea itself surprised me: information, a single call, would cost money. That felt like a whole new paradigm.

## Three libraries, none for agents

My plan was ASP.NET middleware. Before writing it I searched GitHub and found 3 .NET implementations of x402 already: michielpost/x402-dotnet, Atypical-Consulting/x402-dotnet, and support inside FastEndpoints. All three charge for an HTTP endpoint. None implemented the MCP transport, where "payment required" comes back as a failed tool result and the payment travels in the call's metadata. So I dropped the middleware and built that piece instead: [x402-mcp-dotnet](https://github.com/Egoushka/x402-mcp-dotnet).

## One attribute on a tool

A tool marked `[PaidTool("1000")]` costs 0.001 USDC a call; a tool without it stays free. The agent's side is one call that pays only when the server asks, and only within the allowance its wallet was given.

```diagram
{
  "title": "One paid tool call",
  "direction": "right",
  "nodes": [
    { "id": "agent", "label": "Agent with a wallet", "kind": "user" },
    { "id": "server", "label": ".NET MCP server", "kind": "service" },
    { "id": "tool", "label": "Paid tool", "kind": "step" },
    { "id": "facilitator", "label": "Facilitator", "kind": "external" },
    { "id": "chain", "label": "USDC on chain", "kind": "store" }
  ],
  "edges": [
    { "from": "agent", "to": "server", "label": "call with signed payment" },
    { "from": "server", "to": "facilitator", "label": "verify" },
    { "from": "server", "to": "tool", "label": "run" },
    { "from": "server", "to": "facilitator", "label": "settle" },
    { "from": "facilitator", "to": "chain", "label": "moves the USDC" },
    { "from": "server", "to": "agent", "label": "result and receipt" }
  ],
  "caption": "The first call without payment gets a price back. The second carries a signed payment; the server verifies it, runs the tool, settles, and only then returns the output."
}
```

The server never holds a key. The agent signs an authorization to move a fixed amount, and a third service, the facilitator, checks it and moves the money on chain.

## Where the money is decided

**Reuse the HTTP library, not its handler.** I took michielpost's x402 package, version 2.3.0, for the wire types, the facilitator client and the wallet, instead of writing my own. The price: its payment handler needs an HTTP request, so I wrote the sequence of choosing, checking, verifying and settling a payment again for a tool call. The package and the spec also disagree on where the paid resource sits in the payload, so the server reads both places.

**Verify before the tool runs, settle after.** That order decides who carries the risk. A forged payment never reaches the tool. A tool that fails costs the agent nothing, because its signed authorization is never settled. A settlement that fails withholds the output: the tool ran, but nobody got its answer for free. The price is that the tool runs before money moves. If two calls race with the same signed payment, both run; the payment can settle only once, so only one of them gets the output.

**Match exactly or refuse.** A tool refuses a payment signed for another tool, and the server refuses an underpayment before the facilitator hears of it. Each has a test.

## What the tests missed and the network found

The first test run was 11 of 11 green. Then I broke the "failed tool is not charged" branch on purpose, and every test stayed green. The test for it used a tool that throws, and the MCP SDK turns that exception into an error outside my code, so the branch was never reached. A second tool that returns an error instead of throwing made the broken branch fail 1 test. There are 12 now.

The public testnet facilitator at x402.org answered my first real call with a 404. .NET's `HttpClient` drops the last segment of a base address that has no trailing slash, so `/facilitator` disappeared from the address. With the slash, it answered `invalid_exact_evm_insufficient_balance`: the wallet was empty, but the signed payment was well-formed enough to be judged. The sample tool, the National Bank of Ukraine's exchange rate, had bugs of its own: a typo in the API path, another 404, and the rate printed with a decimal comma under the Ukrainian locale. Against the x402 package's mock facilitator, the whole flow ran: "1 EUR = 50.3138 UAH", and a settlement.

## What does not exist yet

No real money has moved, not even test money. The run on Base Sepolia, Coinbase's test network, waits for test USDC: one faucet locked my machine out, and I have not claimed from the other yet.

Only a fixed price per call exists. A tool backed by a language model would rather charge by usage, which x402 calls `upto`. And whether an MCP host pays a 402 on its own is up to that host; today the paying side is code you write.

The market is small, and how small depends on who counts. The x402.org front page shows 75.41M transactions and $24.24M under "Last 30 Days", with no date beside them. In March 2026, CoinDesk, as reported by PANews, put real commerce at about $28,000 a day, about half the transactions wash trading, and the average payment about $0.20. The two are seven months apart and count different things, so I would not divide one by the other.

I would not change anything yet; I want to see it in action first. The next step is one real payment on the test network, with a transaction link anyone can open.

More on agent tooling under [MCP](/topics/mcp/).

## Receipts

- 402 "reserved for future use": [RFC 2068](https://www.rfc-editor.org/rfc/rfc2068) §10.4.3, January 1997; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) §15.5.3, June 2022.
- The MCP transport (`_meta["x402/payment"]`, `_meta["x402/payment-response"]`): [coinbase/x402 specs/transports-v2/mcp.md](https://github.com/coinbase/x402/blob/main/specs/transports-v2/mcp.md).
- The library at its first commit: [Egoushka/x402-mcp-dotnet@6e758e4](https://github.com/Egoushka/x402-mcp-dotnet/tree/6e758e4); the payment order is `src/X402.Mcp/Server/X402ToolPaymentProcessor.cs`, the refusals are `tests/X402.Mcp.Tests/PaidToolTests.cs`.
- The race: the README's Limits, `Egoushka/x402-mcp-dotnet@6e758e4:README.md#L99`; a settlement that fails withholds the output in the test `Failed_settlement_withholds_tool_output`.
- 12 tests, 0 failed: [the CI run at that commit](https://github.com/Egoushka/x402-mcp-dotnet/actions/runs/38043282435).
- The trailing slash: `Egoushka/x402-mcp-dotnet@6e758e4:samples/PaidMcpServer/Program.cs#L8`.
- x402 2.3.0: `Egoushka/x402-mcp-dotnet@6e758e4:src/X402.Mcp/X402.Mcp.csproj#L17`.
- Market: [x402.org](https://www.x402.org/), read 10 October 2026; CoinDesk, 11 March 2026, as reported by [PANews](https://www.aicoin.com/en/news-flash/2790289).
