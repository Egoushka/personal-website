import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import LabBoard from "@/components/LabBoard";
import BoxPanel from "@/components/BoxPanel";
import { LAB_METRICS } from "@/lib/lab";
import { pageMetadata } from "@/lib/metadata";

const description =
  "What my own box measures about itself: uptime from its health checks, live every ten minutes, and the agent merge rate, rebuild time and open findings, each dated until the box publishes it.";

export const metadata: Metadata = pageMetadata({ title: "Lab", description, path: "/lab/" });

/**
 * The lab, as numbers the box checks for itself rather than claims on a CV.
 * Every figure is read from /status.json in the browser; the static page holds
 * the dated readings, so it is complete without JS or without the box.
 */
export default function LabPage() {
  return (
    <Shell>
      <PageHead
        title="Lab"
        lede={
          <>
            What my server measures about itself, refreshed every ten minutes. A figure without a source yet
            says so instead of guessing. The raw file is{" "}
            <a className="link" href="/status.json">
              /status.json
            </a>
            .
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <LabBoard metrics={LAB_METRICS} />
        <BoxPanel />
      </div>
    </Shell>
  );
}
