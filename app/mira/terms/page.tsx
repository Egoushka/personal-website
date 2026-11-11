import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import MiraFooter from "@/components/MiraFooter";
import { pageMetadata } from "@/lib/metadata";
import { MIRA_CONTACT } from "@/lib/mira";

const title = "Terms of sale: Mira's AI Automation Starter Pack";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Terms of sale", description: title, path: "/mira/terms/" }),
  robots: { index: false, follow: false },
};

const mail = <a className="link" href={`mailto:${MIRA_CONTACT}`}>{MIRA_CONTACT}</a>;

export default function MiraTerms() {
  return (
    <Shell>
      <PageHead title={title} />
      <article className="max-w-2xl space-y-4 border-t pt-10 text-lg leading-relaxed">
        <p>
          DRAFT approved by the seller 2026-10-18 for refund, support and update terms; not reviewed by a lawyer. Where
          the checkout provider acts as merchant of record (Paddle, Lemon Squeezy, Gumroad), its terms for payment, tax
          and refund handling apply as well; the provider's refund process wins on any conflict.
        </p>
        <p>
          <strong>Seller:</strong> Yehor Hrabovskyi, sole proprietor (FOP), Ukraine. Contact: {mail}.
        </p>
        <h2 id="what-you-buy" className="pt-4 text-2xl font-semibold">What you buy</h2>
        <p>
          A one-time download: n8n workflow files, a prompt library and a setup guide. Static files, no subscription, no
          hosted service, no account. Mira is an AI-generated presenter; the files were made by a person and run before
          release.
        </p>
        <h2 id="licence" className="pt-4 text-2xl font-semibold">Licence</h2>
        <p>
          You may use the files for yourself, your business and your clients' own internal automations. You may edit
          them. You may not resell, share or publish the files or the prompt library, alone or in a bundle.
        </p>
        <h2 id="refunds" className="pt-4 text-2xl font-semibold">Refunds</h2>
        <p>
          Ask within 14 days of purchase at {mail} (or through the checkout's refund link) and you get the full price
          back. No reason needed.
        </p>
        <h2 id="support" className="pt-4 text-2xl font-semibold">Support</h2>
        <p>
          Email {mail}. I reply within 3 working days. Support covers the files and guide in the pack: importing, the
          listed credentials, and workflows not behaving as their notes describe. It does not cover third-party apps,
          your own changes, or building new workflows.
        </p>
        <h2 id="updates" className="pt-4 text-2xl font-semibold">Updates</h2>
        <p>
          For 12 months from purchase I fix workflows broken by n8n changes and send the corrected files (re-download
          from your receipt link or email me). New workflows are not promised.
        </p>
        <h2 id="responsibility" className="pt-4 text-2xl font-semibold">Your responsibility</h2>
        <p>
          The workflows call AI models and third-party apps with your own keys and accounts. You pay those providers. AI
          output can be wrong: the workflows create drafts and never send or delete on their own; check results before
          relying on them. No income, savings or time-saving results are promised.
        </p>
        <h2 id="liability" className="pt-4 text-2xl font-semibold">Liability</h2>
        <p>
          The files are provided as is. To the extent the law allows, my liability is limited to the price you paid.
          Nothing here limits rights you have under mandatory consumer law.
        </p>
        <h2 id="trademarks" className="pt-4 text-2xl font-semibold">Trademarks</h2>
        <p>
          n8n, OpenAI, Google, Telegram and Todoist are trademarks of their owners. No affiliation or endorsement.
        </p>
      </article>
      <MiraFooter />
    </Shell>
  );
}
