import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import MiraForm from "@/components/MiraForm";
import { pageMetadata } from "@/lib/metadata";

const description =
  "Mira is an openly AI-generated persona about AI automations and n8n. A free inbox-triage workflow and five prompts.";

/** Link-in-bio target for Mira's Instagram: reachable by link, not listed in the sitemap or the nav. */
export const metadata: Metadata = {
  ...pageMetadata({ title: "Mira", description, path: "/mira/" }),
  robots: { index: false, follow: false },
};

export default function Mira() {
  return (
    <Shell>
      <PageHead title="Mira" lede="An AI persona that shares small automations you can run yourself." />
      <div className="max-w-2xl space-y-10 border-t py-10">
        <section aria-labelledby="mira-about" className="space-y-4 text-lg leading-relaxed">
          <h2 id="mira-about" className="text-sm font-medium text-muted-foreground">Who this is</h2>
          <p>
            Mira is an AI-generated persona. The images, voice and captions are made with AI tools;
            there is no human named Mira. It is run by me, Yehor Hrabovskyi, a developer, and I
            check every step before anything is published.
          </p>
          <p>
            What it shares: n8n workflows and prompts for everyday tasks, with setup notes and
            their limits. No income claims, no promises.
          </p>
        </section>
        <section aria-labelledby="mira-free" className="space-y-4">
          <h2 id="mira-free" className="text-sm font-medium text-muted-foreground">Free: inbox-triage n8n workflow + 5 prompts</h2>
          <p className="text-lg leading-relaxed">
            The workflow labels new Gmail mail and saves a holding reply as a draft. It never sends
            or deletes anything. Enter your email to get the files.
          </p>
          <MiraForm />
        </section>
      </div>
    </Shell>
  );
}
