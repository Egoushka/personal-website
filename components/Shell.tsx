import Nav, { type Section } from "@/components/Nav";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { GUTTER, WIDTHS, type Width } from "@/lib/layout";

/**
 * The frame of every page: header, `<main id="main">`, footer — siblings, in that
 * order. Header and footer stay outside `<main>` so the skip link skips them and
 * they are the page's banner and contentinfo landmarks.
 */
export default function Shell({
  current,
  width = "default",
  className,
  children,
}: {
  current?: Section;
  width?: Width;
  /** Extra classes for `<main>`. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav current={current} width={width} />
      <main id="main" className={cn("mx-auto w-full", WIDTHS[width], GUTTER, className)}>
        {children}
      </main>
      <Footer width={width} />
    </>
  );
}
