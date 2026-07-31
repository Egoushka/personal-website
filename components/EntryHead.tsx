import Link from "next/link";

/**
 * The head of any page that is not the balance itself.
 *
 * Every page here exists because some claim needs paying for, so each one opens
 * by naming that claim and linking back to the row it answers. Under the title
 * come the page's own figures — how many, how fresh, when it expires — in the
 * same narrow the balance sets its evidence in.
 *
 * A page that cannot name the claim it belongs to is a page with no reason to
 * exist; pass no `claim` only for the ones that genuinely stand outside the
 * ledger, and expect to justify it.
 */
export default function EntryHead({
  title,
  claim,
  figures,
  lede,
}: {
  title: string;
  claim?: { href: string; label: string };
  figures?: React.ReactNode;
  lede?: React.ReactNode;
}) {
  return (
    <header className="sheet-head">
      {claim && (
        <p className="entry-line">
          <Link href={claim.href}>{claim.label}</Link>
        </p>
      )}
      <h1>{title}</h1>
      {figures && <p className="sheet-drawn">{figures}</p>}
      {lede && <p className="sheet-lede">{lede}</p>}
    </header>
  );
}
