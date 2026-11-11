import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PartnerComposer from "@/components/PartnerComposer";
import StatusFig from "@/components/StatusFig";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { ATTEST_FALLBACK, BOX_FALLBACK, CHANNELS, CHARGEHAND } from "@/lib/shop";
import { Users, Plug, Megaphone, MessageSquare, Mail } from "@/components/ui/icons";

const description =
  "Build with me, not buy from me. Co-building, integrations and distribution for agent tools; terms are one written page, agreed before anyone writes code.";

export const metadata: Metadata = pageMetadata({ title: "Partner", description, path: "/partner/" });

const ICON = { users: Users, plug: Plug, megaphone: Megaphone, message: MessageSquare };

const STEPS = [
  ["Talk", "Email what it is, what you have, what you want from it."],
  ["One page", "Who builds what, who pays which cost, how the split is paid, when it ends. Written before code."],
  ["Build", "In the open where possible. Every claim gets a link."],
  ["Split", "Paid as agreed. No product has earned a cent yet, so no split is listed here."],
];

export default function Partner() {
  return (
    <Shell current="partner">
      <header className="hero hero-slim">
        <div>
          <h1>Partner</h1>
          <p className="lede">
            Build with me, not buy from me. I am looking for people to build products with: co-building, integrations,
            distribution. Terms are one written page, agreed before anyone writes code.
          </p>
        </div>
      </header>
      <div className="kpis mb-4">
        <div className="kpi">
          <span>open channels</span>
          <span className="figv">{CHANNELS.length}</span>
          <em>listed below</em>
        </div>
        <div className="kpi">
          <span>revenue shared so far</span>
          <span className="figv">0</span>
          <em>no product has earned yet</em>
        </div>
      </div>
      <div className="mc-grid">
        <section className="pn" style={{ "--c": 12 } as React.CSSProperties} aria-labelledby="chan-h">
          <div className="pn-head">
            <h2 id="chan-h">Open channels</h2>
            <span className="chip chip-good">open</span>
          </div>
          <ul className="chans">
            {CHANNELS.map((c) => {
              const Icon = ICON[c.icon];
              return (
                <li className="ch" key={c.id}>
                  <Icon aria-hidden="true" />
                  <div>
                    <b>{c.name}</b>
                    <p>{c.text}</p>
                  </div>
                  <a className="key key-sm" href="#compose">
                    Ask about this
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="pn" style={{ "--c": 6 } as React.CSSProperties} aria-labelledby="bring-h">
          <div className="pn-head">
            <h2 id="bring-h">What I bring</h2>
            <span className="text-xs text-muted-foreground">each with a source</span>
          </div>
          <ul className="bring">
            <li>
              <span className="figv">
                <StatusFig pick="downloads" fallback={String(ATTEST_FALLBACK.downloads)} />
              </span>
              <div>
                <b>A .NET backend that holds up.</b>
                <p>Attest validates 87 countries with 197 upstream defects fixed; its NuGet downloads are the figure at left.</p>
              </div>
            </li>
            <li>
              <span className="figv">{CHARGEHAND.prs}</span>
              <div>
                <b>Agent tooling, measured.</b>
                <p>chargehand: {CHARGEHAND.prs} pull requests to v{CHARGEHAND.version}, and the blind test it lost is published.</p>
              </div>
            </li>
            <li>
              <span className="figv">x402</span>
              <div>
                <b>Paid calls for agents.</b>
                <p>x402 in .NET: an agent pays per call and never for a call that failed.</p>
              </div>
            </li>
            <li>
              <span className="figv">
                <StatusFig pick="containers" fallback={String(BOX_FALLBACK.containers)} />
              </span>
              <div>
                <b>A box that is boring on purpose.</b>
                <p>Containers at left, every stack defined in git.</p>
              </div>
            </li>
          </ul>
        </section>
        <section className="pn" style={{ "--c": 6 } as React.CSSProperties} aria-labelledby="how-h">
          <div className="pn-head">
            <h2 id="how-h">How it works</h2>
            <span className="text-xs text-muted-foreground">four steps, nothing signed before step 2</span>
          </div>
          <ol className="grid gap-4">
            {STEPS.map(([t, d]) => (
              <li key={t}>
                <b className="font-semibold">{t}</b>
                <p className="text-[0.8125rem] leading-5 text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="compose" className="pn" style={{ "--c": 12 } as React.CSSProperties} aria-labelledby="compose-h">
          <div className="pn-head">
            <h2 id="compose-h">
              <Mail aria-hidden="true" /> Write to me
            </h2>
            <span className="text-xs text-muted-foreground">opens your mail app; nothing is sent from this page</span>
          </div>
          <PartnerComposer email={site.email} />
          <noscript>
            <p className="mt-3 text-sm">
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </noscript>
        </section>
      </div>
      <div className="pb-16" />
    </Shell>
  );
}
