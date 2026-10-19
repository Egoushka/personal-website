import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import MiraFooter from "@/components/MiraFooter";
import { pageMetadata } from "@/lib/metadata";
import { MIRA_CONTACT } from "@/lib/mira";

const title = "Privacy notice: Mira's AI Automation Starter Pack";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Privacy notice", description: title, path: "/mira/privacy/" }),
  robots: { index: false, follow: false },
};

const mail = <a className="link" href={`mailto:${MIRA_CONTACT}`}>{MIRA_CONTACT}</a>;

export default function MiraPrivacy() {
  return (
    <Shell>
      <PageHead title={title} />
      <article className="max-w-2xl space-y-4 border-t pt-10 text-lg leading-relaxed">
        <p>
          DRAFT, not reviewed by a lawyer. Controller: Yehor Hrabovskyi, sole proprietor (FOP), Ukraine, {mail}.
        </p>
        <h2 id="collect" className="pt-4 text-2xl font-semibold">What I collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Email form (free pack):</strong> your email address, the time, and which form. Used to send the free
            pack and, if you tick the box, occasional emails about the pack. Unsubscribe link in every email.
          </li>
          <li>
            <strong>Purchase:</strong> the checkout provider (merchant of record) takes your payment, name, email,
            country and tax details under its own privacy notice. I receive your email, country, order id and amount to
            deliver the files and give support.
          </li>
          <li><strong>Support:</strong> what you write to me.</li>
          <li>
            <strong>Site analytics:</strong> aggregate page views from a self-hosted, cookie-less analytics tool; no
            advertising trackers.
          </li>
        </ul>
        <h2 id="not-collected" className="pt-4 text-2xl font-semibold">What I do not collect</h2>
        <p>
          Card numbers (never reach me). Anything from your n8n, AI provider or app accounts: the workflows run on your
          own instance, and I never see your data, keys or credentials.
        </p>
        <h2 id="sharing" className="pt-4 text-2xl font-semibold">Sharing</h2>
        <p>
          Only the checkout provider and the email service that sends the free pack and receipts. No sale of data.
        </p>
        <h2 id="retention" className="pt-4 text-2xl font-semibold">Retention and your rights</h2>
        <p>
          Email-list data until you unsubscribe; order and tax records as long as Ukrainian law requires (up to 3
          years); support emails 2 years. Ask at {mail} to see, correct or delete your data (except records the law
          requires me to keep), or to object to emails. You may complain to your local data-protection authority.
        </p>
      </article>
      <MiraFooter />
    </Shell>
  );
}
