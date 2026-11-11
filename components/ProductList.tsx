"use client";

import { useState } from "react";
import { useStatus } from "@/lib/status";
import { PRODUCTS, STATE_COUNTS, STATE_NOTE, shortDate, type ProductState } from "@/lib/shop";
import { ArrowUpRight, Plus } from "@/components/ui/icons";

const CHIP: Record<ProductState, string> = {
  coming: "chip chip-plan",
  building: "chip chip-warn",
  rebuilding: "chip chip-live",
};

type Filter = "all" | ProductState;

/**
 * The seven products. `full` is the Shop's board with a filter and column
 * heads; without it, the compact list on the home. Rows are details elements,
 * so they open without JS; only the filter needs it.
 */
export default function ProductList({ full = false }: { full?: boolean }) {
  const [f, setF] = useState<Filter>("all");
  const s = useStatus();
  const attest = s?.package ?? undefined;

  return (
    <>
      {full && (
        <div className="seg mb-3" role="group" aria-label="Filter products">
          {(
            [
              ["all", `All ${PRODUCTS.length}`],
              ["rebuilding", `rebuilding ${STATE_COUNTS.rebuilding}`],
              ["building", `building ${STATE_COUNTS.building}`],
              ["coming", `coming ${STATE_COUNTS.coming}`],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={f === id} onClick={() => setF(id)}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className={full ? "plist plist-full" : "plist"}>
        {full && (
          <div className="thead thead-on" aria-hidden="true">
            <span>Product</span>
            <span>State</span>
            <span>Usage</span>
            <span>Free</span>
            <span>Paid</span>
            <span />
          </div>
        )}
        {PRODUCTS.map((p) => {
          const usage =
            p.id === "attest" && attest ? `${attest.downloads} NuGet downloads · v${attest.version}` : p.usage;
          const internal = p.key.href.startsWith("/");
          return (
            <details
              key={p.id}
              id={p.id}
              className={f === "all" || f === p.state ? "prow" : "prow is-hidden"}
              open={full && p.id === "checker" ? true : undefined}
            >
              <summary>
                <span className="pname">
                  <b>{p.name}</b>
                  <span className="host">{p.host}</span>
                </span>
                <span className={CHIP[p.state]}>{p.state}</span>
                <span className="pu num">{usage}</span>
                {full && <span className="pf">{p.free}</span>}
                {full && <span className="pp">{p.paid}</span>}
                <Plus className="tw" aria-hidden="true" />
              </summary>
              <div className="pbody">
                <p>{p.body}</p>
                <dl className="fp">
                  <div>
                    <dt>Free</dt>
                    <dd>{p.free}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{p.paid}</dd>
                  </div>
                </dl>
                {p.last ? (
                  <a className="lastc" href={p.last.href} rel="noopener">
                    <span>Last commit</span>
                    <span className="num">{shortDate(p.last.at)}</span>
                    <span>{p.last.label}</span>
                  </a>
                ) : (
                  <p>No public repository yet.</p>
                )}
                <p className="flex flex-wrap items-center gap-3">
                  <a className="key key-sm" href={p.key.href} {...(internal ? {} : { rel: "noopener" })}>
                    {p.key.label} <ArrowUpRight />
                  </a>
                  {p.state === "coming" && !internal && (
                    <span className="text-xs text-muted-foreground">Not deployed: the link does not answer yet.</span>
                  )}
                </p>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}

