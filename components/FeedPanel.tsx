"use client";

import { useState } from "react";
import { FEED, READ_DATE, commitUrl, shortDate } from "@/lib/shop";
import { GitCommitHorizontal } from "@/components/ui/icons";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "chargehand", label: "chargehand" },
  { id: "others", label: "Others" },
] as const;

/** Public commits as last read. Every row is a commit on GitHub; nothing is simulated. */
export default function FeedPanel() {
  const [f, setF] = useState<(typeof FILTERS)[number]["id"]>("all");
  const show = (repo: string) => f === "all" || (f === "chargehand") === (repo === "chargehand");

  return (
    <section className="pn" aria-labelledby="feed-h">
      <div className="pn-head">
        <h2 id="feed-h">
          <GitCommitHorizontal aria-hidden="true" /> Shipping, from GitHub
        </h2>
        <div className="seg" role="group" aria-label="Filter commits">
          {FILTERS.map((x) => (
            <button key={x.id} type="button" aria-pressed={f === x.id} onClick={() => setF(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="feed pn-body">
        {FEED.map((c) => (
          <li key={c.sha} className={show(c.repo) ? undefined : "is-hidden"}>
            <a href={commitUrl(c.repo, c.sha)} rel="noopener">
              <time className="ft num" dateTime={c.at}>
                {shortDate(c.at)}
              </time>
              <span className="fr">{c.repo}</span>
              <span className="fm">{c.message}</span>
              <span className="fs num">{c.sha}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="pn-foot">
        <span>GitHub, public repositories, read {READ_DATE}</span>
        <a href="https://github.com/Egoushka" rel="noopener">
          all activity
        </a>
      </div>
    </section>
  );
}
