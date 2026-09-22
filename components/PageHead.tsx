/**
 * The head of every page that is not the home page.
 *
 * Title, then the page's own counted figures, then one line saying what the page
 * is for. The figures line is not decoration: it is the same discipline the
 * whole site runs on — if a page can count something about itself, it says so
 * rather than asserting it.
 *
 * This replaces `EntryHead`, which opened every page by naming the ledger claim
 * it was evidence for. The ledger is gone (ADR 0002) and so is the claim line.
 */
export default function PageHead({
  title,
  figures,
  lede,
  quiet,
}: {
  title: string;
  figures?: React.ReactNode;
  lede?: React.ReactNode;
  /**
   * The page shows its own contents rather than announcing them, so the title
   * is for the document outline only. It stays in the DOM: it is the `<h1>` a
   * screen reader reads on arrival, the heading search engines index, and the
   * thing that keeps the heading order legal now that `h2` starts the page.
   * It is never simply deleted.
   */
  quiet?: boolean;
}) {
  return (
    <header className={quiet ? "page-head page-head--quiet" : "page-head"}>
      <h1 className={quiet ? "visually-hidden" : undefined}>{title}</h1>
      {figures && <p className="page-figures">{figures}</p>}
      {lede && <p className="page-lede">{lede}</p>}
    </header>
  );
}
