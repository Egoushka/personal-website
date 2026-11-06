import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import MiraFooter from "@/components/MiraFooter";
import { pageMetadata } from "@/lib/metadata";
import { MIRA_CHECKOUT_URL, MIRA_CONTACT } from "@/lib/mira";

const description =
  "Mira's AI Automation Starter Pack: 10 ready-made n8n workflows, 50 copy-and-paste prompts and a setup guide for non-developers.";

/** Sales page for the paid pack: reachable by link, not listed in the sitemap or the nav. */
export const metadata: Metadata = {
  ...pageMetadata({ title: "Mira's AI Automation Starter Pack", description, path: "/mira/pack/" }),
  robots: { index: false, follow: false },
};

const heading = "text-sm font-medium text-muted-foreground";
const buy =
  "inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium";

const WHO_FOR = [
  "You do repetitive admin work (email, notes, receipts, follow-ups) and want part of it automated.",
  "You are comfortable following step-by-step instructions, with no coding.",
  "You are willing to spend about 30 minutes on setup and a few cents per day on AI usage.",
  "You run a small business, freelance, or manage your own work.",
];

const NOT_FOR = [
  "You want something that works with no setup. You will create accounts, keys and credentials.",
  "You need a custom enterprise system. These are starting templates for personal and small-team use.",
  "You expect results without checking them. The AI can be wrong; workflows create drafts, and you review them.",
  "You need support for apps outside the ones listed below.",
];

const CONTENTS: { n: string; item: string; does: string; needs: string }[] = [
  { n: "0", item: "inbox-triage", does: "New Gmail message: label it and draft a reply for routine mail", needs: "Gmail, LLM" },
  { n: "1", item: "meeting-notes", does: "Audio file in a Drive folder: transcript, summary, decisions, action items in a Google Doc and an email", needs: "Drive, OpenAI (Whisper), Docs, Gmail" },
  { n: "2", item: "receipts-to-sheet", does: "Photo of a receipt sent to a Telegram bot: merchant, date, total, category as a Google Sheets row", needs: "Telegram, vision-capable LLM, Sheets" },
  { n: "3", item: "voice-notes-to-tasks", does: "Telegram voice message: transcript and tasks with due dates in Todoist", needs: "Telegram, OpenAI, Todoist" },
  { n: "4", item: "daily-brief", does: "Every morning: weather, today's calendar and RSS headlines as a short brief on Telegram", needs: "Calendar, Telegram, LLM" },
  { n: "5", item: "weekly-review", does: "Friday afternoon: last week's calendar and completed tasks, a review and next week's top 3 by email", needs: "Calendar, Todoist, Gmail, LLM" },
  { n: "6", item: "link-summary", does: "Send a link to a Telegram bot: 5-point summary and a \"worth reading?\" verdict", needs: "Telegram, LLM" },
  { n: "7", item: "form-to-crm", does: "Website form: classify and score the lead, draft a reply, add a CRM row in Sheets", needs: "Webhook, Sheets, Gmail, LLM" },
  { n: "8", item: "content-repurpose", does: "New post in your RSS feed: LinkedIn, X thread and newsletter drafts in a Sheets queue for approval", needs: "RSS, Sheets, LLM" },
  { n: "9", item: "faq-bot", does: "Telegram question: answers only from your FAQ Google Doc, otherwise says it will ask a human and notifies you", needs: "Telegram, Docs, LLM" },
  { n: "10", item: "invoice-reminders", does: "Daily: unpaid overdue invoices in Sheets become polite reminder drafts in Gmail", needs: "Sheets, Gmail, LLM" },
  { n: "", item: "Prompt library", does: "50 fill-in prompts in 10 categories, as Markdown and CSV (Notion import)", needs: "Any chat model" },
  { n: "", item: "Setup guide", does: "n8n Cloud or Docker, credentials, importing, first run, reading executions, 10 troubleshooting items", needs: "n/a" },
];

const STEPS = [
  "Get n8n running (Cloud or a Docker command).",
  "Import a workflow file.",
  <>Create the credentials and fill in the <code>CHANGE ME</code> fields.</>,
  "Run it once on your own data, check the result, switch it on.",
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "Do I need to code?", a: "No. You click, paste keys and edit a few fields. If you can follow a recipe, you can follow the guide. The few places that touch a code-like setting (the Docker command, an expression) are copy-and-paste." },
  { q: "Which n8n version?", a: "Built and imported on n8n 2.42.3. Newer versions should import cleanly; older versions may be missing nodes. The guide shows how to check your version." },
  { q: "Cloud or self-hosted?", a: "Both work. The guide covers each. Note that Telegram and webhook workflows need n8n reachable from the internet, and scheduled workflows need n8n to be running." },
  { q: "What will it cost to run?", a: "Your AI provider charges per use. The default is a small, low-cost model, and each workflow lists an estimate per run. Prices change; check your provider's price page and set a usage limit." },
  { q: "Can I use Claude, Gemini or a local model instead of OpenAI?", a: "Yes for the text steps: replace one node. Audio transcription (workflows 1 and 3) and receipt photos (workflow 2) use OpenAI-specific or vision features and need separate replacement; the guide explains." },
  { q: "Will it send emails by itself?", a: "No. Email workflows create drafts. Nothing is deleted." },
  { q: "Is Mira a real person?", a: "No. Mira is an AI-generated presenter, labelled as such on every post. The workflows and files are real and were run before they were put in the pack." },
  { q: "What results can I expect?", a: "Time saved depends on how often you do the chore and how well your data fits. No figures are promised." },
  { q: "Refunds?", a: <>Yes. Ask within 14 days of purchase at {MIRA_CONTACT} (or through the receipt's refund link) and you get the full price back. No reason needed. See the <Link prefetch={false} className="link" href="/mira/terms/#refunds">terms</Link>.</> },
  { q: "What if something does not work?", a: <>Start with the troubleshooting table in the guide. Still stuck? Email {MIRA_CONTACT}; I reply within 3 working days.</> },
  { q: "Do I get updates?", a: "Yes, for 12 months from purchase: if an n8n change breaks a workflow I fix it and you re-download the corrected files for free. New workflows are not promised." },
];

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

export default function MiraPack() {
  return (
    <Shell>
      <PageHead
        title="Ten automations you can import today."
        lede="Mira's AI Automation Starter Pack: 10 ready-made n8n workflows, 50 copy-and-paste prompts, and a setup guide that takes a non-developer from nothing to a running workflow in about 30 minutes."
      />
      <div className="max-w-2xl space-y-10 border-t py-10 text-lg leading-relaxed">
        <section aria-labelledby="pack-buy" className="space-y-4">
          <h2 id="pack-buy" className={heading}>Get the pack</h2>
          {MIRA_CHECKOUT_URL ? (
            <a className={`${buy} bg-brand text-brand-foreground shadow-xs hover:bg-brand/90`} href={MIRA_CHECKOUT_URL}>
              Get the pack, $19 launch price
            </a>
          ) : (
            <span aria-disabled="true" className={`${buy} cursor-not-allowed border text-muted-foreground`}>
              Checkout opens soon
            </span>
          )}
          <p className="text-base text-muted-foreground">
            Launch price $19 for the first 7 days after launch, then $29. One payment, files you keep.
          </p>
          <p className="text-base">
            Not sure yet?{" "}
            <Link prefetch={false} className="link" href="/mira/">Get the free inbox-triage workflow and 5 prompts.</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Mira is an AI-generated presenter. The workflows, prompts and guide were built by a person.
          </p>
        </section>

        <section aria-labelledby="pack-problem" className="space-y-4">
          <h2 id="pack-problem" className={heading}>The problem</h2>
          <p>
            Email triage, meeting notes, receipts, a daily plan. Small chores that repeat every week. You can hand many
            of them to an automation, but starting from a blank canvas is where most people stop. This pack gives you
            working starting points and shows how to adjust them.
          </p>
        </section>

        <section aria-labelledby="pack-for" className="space-y-4">
          <h2 id="pack-for" className={heading}>Who it is for</h2>
          <List items={WHO_FOR} />
        </section>

        <section aria-labelledby="pack-not-for" className="space-y-4">
          <h2 id="pack-not-for" className={heading}>Who it is not for</h2>
          <List items={NOT_FOR} />
        </section>

        <section aria-labelledby="pack-inside" className="space-y-4">
          <h2 id="pack-inside" className={heading}>What is inside</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-base">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">#</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Item</th>
                  <th scope="col" className="py-2 pr-3 font-medium">What it does</th>
                  <th scope="col" className="py-2 font-medium">Needs</th>
                </tr>
              </thead>
              <tbody>
                {CONTENTS.map((r) => (
                  <tr key={r.item} className="border-b align-top">
                    <td className="py-2 pr-3 tabular-nums">{r.n}</td>
                    <td className="py-2 pr-3 font-medium">{r.item}</td>
                    <td className="py-2 pr-3">{r.does}</td>
                    <td className="py-2">{r.needs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Every workflow has a sticky note on the canvas with what it does, which credentials to create, the two or
            three fields to change (marked <code>CHANGE ME</code>), a cost estimate per run, and how to test it.
            Workflows create drafts and never send or delete anything on their own.
          </p>
        </section>

        <section aria-labelledby="pack-how" className="space-y-4">
          <h2 id="pack-how" className={heading}>How it works</h2>
          <ol className="list-decimal space-y-2 pl-6">
            {STEPS.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <p>
            The AI step uses a swappable model node. Default: OpenAI <code>gpt-4.1-mini</code>. You can replace it with
            Anthropic, Gemini, or a local Ollama model; the guide shows how.
          </p>
        </section>

        <section aria-labelledby="pack-price" className="space-y-4">
          <h2 id="pack-price" className={heading}>Price</h2>
          <p>
            <strong>$29</strong>, launch price <strong>$19</strong> for the first 7 days after launch. One payment, no
            subscription. You also pay your own AI provider for usage (cents per run for the default model; see each
            workflow's note) and, if you choose n8n Cloud, for n8n.
          </p>
          {!MIRA_CHECKOUT_URL && <p className="text-base text-muted-foreground">Checkout opens soon.</p>}
        </section>

        <section aria-labelledby="pack-faq" className="space-y-4">
          <h2 id="pack-faq" className={heading}>FAQ</h2>
          <dl className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <MiraFooter />
    </Shell>
  );
}
