import Link from "next/link";
import { MIRA_CONTACT } from "@/lib/mira";

/** Seller contact and the policy links shared by /mira/pack/, /mira/terms/ and /mira/privacy/. */
export default function MiraFooter() {
  return (
    <div className="max-w-2xl space-y-3 border-t py-8 text-sm leading-relaxed text-muted-foreground">
      <p>
        Mira is AI-generated. Not affiliated with n8n, OpenAI, Google, Telegram or Todoist; names are used to
        describe compatibility.
      </p>
      <p>
        Seller: Yehor Hrabovskyi, sole proprietor (FOP), Ukraine.{" "}
        <a className="link" href={`mailto:${MIRA_CONTACT}`}>{MIRA_CONTACT}</a>
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        <li><Link prefetch={false} className="link" href="/mira/terms/">Terms of sale</Link></li>
        <li><Link prefetch={false} className="link" href="/mira/privacy/">Privacy</Link></li>
        <li><Link prefetch={false} className="link" href="/mira/terms/#refunds">Refund policy (14 days)</Link></li>
      </ul>
    </div>
  );
}
