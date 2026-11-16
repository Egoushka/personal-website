import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { Mail } from "@/components/ui/icons";

const description =
  "A written review of how your .NET app talks to SQL Server: at least 10 numbered findings with evidence, the top three as patches, in 10 working days, for a fixed price.";

// Unlinked from the nav, the footer and the sitemap, and noindex, until the owner says otherwise.
export const metadata: Metadata = {
  ...pageMetadata({ title: "EF Core and SQL Server Query Review", description, path: "/review/" }),
  robots: { index: false },
};

const SUBJECT = encodeURIComponent("EF Core review");

const GET = [
  "A report with at least 10 numbered findings. Each one has the evidence (query text, plan or timing, code location), a severity, the effort and the fix.",
  "The findings as a CSV, so you can paste them into your tracker.",
  "Patches for the top three findings, as diffs against your branch.",
  "A 60-minute debrief call.",
  "30 days of written questions about the report.",
];

const SCOPE = [
  "EF Core usage: N+1 and cartesian explosions, split against single queries, tracking, projections, compiled queries, bulk work, DbContext lifetime and pooling.",
  "The SQL Server side as your app sees it: top queries from Query Store or a capture, missing, duplicate and unused indexes, parameter sniffing, blocking, deadlocks, timeouts, isolation levels.",
  "Reliability around the database: retries, transaction scope, idempotent writes, and migration safety (locks, long backfills, rollback).",
];

const NOT = [
  "No fixes beyond the top three patches. No retainers, no on-call.",
  "No architecture, security, front-end, infrastructure or cloud cost review.",
  "No production access and no production data. Read-only access to code, plus a staging copy or anonymized query statistics.",
  "SQL Server only. No PostgreSQL, no Dapper-only apps.",
  "No promised speedup. The guarantee covers the count and the evidence.",
];

const STEPS = [
  "Email what is slow, plus your .NET and SQL Server versions.",
  "I reply within 2 working days and say whether it fits.",
  "We sign a one-page order form and a mutual NDA.",
  "You give me read-only access.",
  "I deliver the report. The debrief follows.",
];

const FAQ: [string, string][] = [
  ["Do you need production data?", "No. See above."],
  ["Is this a hire?", "No. It's a report with a fixed deliverable and a fixed date. I don't join your team and I don't take your tickets."],
  ["Why this price?", "It's about 14 hours of senior work on a codebase I haven't seen, written down so anyone on your side can use it. Other sellers charge 1,500 to 5,000 USD for similar scope; I'm at the low end because I'm new at this."],
  ["What if you find fewer than 10?", "You get all your money back."],
  ["Can you fix it?", "I patch the top three. Anything more is a separate quote, and you can say no to it."],
  ["Will you always say yes?", "No. I may decline an engagement that conflicts with an obligation I already have. I'll tell you that in my reply, before anything is signed."],
];

export default function Review() {
  return (
    <Shell>
      <article className="max-w-2xl">
        <PageHead
          title="A written review of how your .NET app talks to SQL Server"
          lede="At least 10 numbered findings with evidence, the top three as patches, in 10 working days, for a fixed price. Fewer than 10 and you're refunded."
        />
        <div className="space-y-10 text-lg leading-relaxed pb-12">
          <section aria-labelledby="who-h">
            <h2 id="who-h" className="text-xl font-semibold tracking-tight">Who it&apos;s for</h2>
            <p className="mt-3">
              A team running EF Core on SQL Server that has slow pages, timeouts or deadlocks, and nobody who reads query
              plans. It isn&apos;t for PostgreSQL, Dapper-only apps or infrastructure reviews.
            </p>
          </section>

          <section aria-labelledby="get-h">
            <h2 id="get-h" className="text-xl font-semibold tracking-tight">What you get</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {GET.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-base font-semibold">What I look at</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {SCOPE.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="mt-3 text-base text-muted-foreground">
              One application, one SQL Server database, up to about 100,000 lines of C#.
            </p>
          </section>

          <section aria-labelledby="not-h">
            <h2 id="not-h" className="text-xl font-semibold tracking-tight">What I don&apos;t do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {NOT.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="price-h">
            <h2 id="price-h" className="text-xl font-semibold tracking-tight">Price</h2>
            <p className="mt-3">
              <span className="font-mono text-3xl font-semibold tabular-nums">1,500 USD</span>, flat, excluding VAT where
              it applies. 50% when you order, 50% on delivery. I send an invoice and you pay by bank transfer (SWIFT)
              in USD or EUR; Payoneer is my second option. There&apos;s no card checkout on this site.
            </p>
          </section>

          <section aria-labelledby="how-h">
            <h2 id="how-h" className="text-xl font-semibold tracking-tight">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              {STEPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="mt-3 text-base text-muted-foreground">
              Delivery is 10 working days from the day access works. I do this work in my own time, on my own equipment.
            </p>
          </section>

          <section aria-labelledby="free-h">
            <h2 id="free-h" className="text-xl font-semibold tracking-tight">Free first</h2>
            <p className="mt-3">
              The checklist and the Query Store scripts I review against are free, so a team can start alone. The review
              is for when you want a second pair of eyes and a report you can hand to anyone.
            </p>
          </section>

          <section aria-labelledby="terms-h">
            <h2 id="terms-h" className="text-xl font-semibold tracking-tight">Terms in plain words</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>My liability is capped at the fee. I don&apos;t guarantee a performance gain.</li>
              <li>You own the report. I keep my methods and scripts.</li>
              <li>Everything about your system is confidential. I never publish customer details.</li>
              <li>Cancel before access is given and the deposit comes back. After that it stays.</li>
              <li>I delete your material 30 days after delivery.</li>
            </ul>
            <p className="mt-3 text-base text-muted-foreground">
              The order form, the mutual NDA and the full terms come with my reply.
            </p>
          </section>

          <section aria-labelledby="faq-h">
            <h2 id="faq-h" className="text-xl font-semibold tracking-tight">Questions</h2>
            <dl className="mt-3 space-y-4">
              {FAQ.map(([q, a]) => (
                <div key={q}>
                  <dt className="font-semibold">{q}</dt>
                  <dd className="mt-1">{a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="ask-h">
            <h2 id="ask-h" className="text-xl font-semibold tracking-tight">Ask</h2>
            <p className="mt-3">Email me what is slow and which versions you run. That&apos;s all I need to say yes or no.</p>
            <p className="mt-4">
              <a className="key key-primary key-lg" href={`mailto:${site.email}?subject=${SUBJECT}`}>
                <Mail aria-hidden="true" /> Email about a review
              </a>
            </p>
          </section>
        </div>
      </article>
    </Shell>
  );
}
