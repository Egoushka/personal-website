import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import { getRadar, byRing, RINGS, RING_MEANING, type Ring } from "@/lib/radar";
import { pageMetadata } from "@/lib/metadata";

const description =
  "What I adopt, trial, assess or hold in my own projects, each with the reason and the result of the trial.";

export const metadata: Metadata = pageMetadata({ title: "Radar", description, path: "/radar/" });

// A word beside every colour: the ring name is always printed.
const RING_TONE: Record<Ring, string> = {
  adopt: "text-success",
  trial: "text-info",
  assess: "text-warning",
  hold: "text-muted-foreground",
};

/**
 * /radar/ — read-only (ADR 0001). The data is content/radar.json, checked against
 * content/radar.schema.json at `npm run validate` and again here at build.
 */
export default function Radar() {
  const entries = getRadar();
  const rings = byRing(entries);

  return (
    <Shell className="radar-page">
      <PageHead
        title="Radar"
        lede={description}
        figures={RINGS.map((r) => (
          <span key={r}>
            <span className="font-semibold text-foreground">{rings[r].length}</span> {r}
          </span>
        ))}
      />

      {entries.length === 0 && <p className="text-muted-foreground">Nothing is on the radar yet.</p>}

      <div className="grid gap-10 pb-8">
        {RINGS.map((ring) => (
          <section key={ring} aria-labelledby={`ring-${ring}`}>
            <h2 id={`ring-${ring}`} className="font-display text-2xl font-semibold capitalize">
              <span className={RING_TONE[ring]}>{ring}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{RING_MEANING[ring]}</p>
            {rings[ring].length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {rings[ring].map((e) => (
                  <li key={e.name} className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="font-semibold">{e.name}</h3>
                      <p className="text-xs font-medium text-muted-foreground">
                        {e.quadrant} · since <time dateTime={e.since}>{e.since}</time>
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{e.reason}</p>
                    {e.result && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">Result: </span>
                        {e.result}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </Shell>
  );
}
