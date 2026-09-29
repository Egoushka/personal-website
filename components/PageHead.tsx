import { cn } from "@/lib/utils";

/**
 * The head of every page that is not the home page: an optional eyebrow, the
 * title, one line on what the page is for, then the page's own counted figures.
 * If a page can count something about itself, it says so rather than asserting it.
 */
export default function PageHead({
  title,
  eyebrow,
  figures,
  lede,
  quiet,
  className,
  children,
}: {
  title: string;
  eyebrow?: React.ReactNode;
  figures?: React.ReactNode;
  lede?: React.ReactNode;
  /**
   * The page shows its own contents rather than announcing them, so the title is
   * for the document outline only. It stays in the DOM: it is the `<h1>` a screen
   * reader reads on arrival and the heading search engines index.
   */
  quiet?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("page-head pt-10 pb-8 md:pt-14 md:pb-10", quiet && "pt-8 pb-4 md:pt-10", className)}>
      {eyebrow && <div className="mb-4">{eyebrow}</div>}
      <h1 className={quiet ? "visually-hidden" : "font-display text-4xl font-semibold tracking-tight md:text-5xl"}>{title}</h1>
      {lede && <p className="page-lede mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{lede}</p>}
      {figures && (
        <p className={cn("page-figures flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums", !quiet && "mt-5")}>
          {figures}
        </p>
      )}
      {children}
    </header>
  );
}
