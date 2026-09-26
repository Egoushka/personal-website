import Nav, { type Section } from "@/components/Nav";
import Footer from "@/components/Footer";

/**
 * The frame of every page: header, `<main id="main">`, footer — in that order,
 * and siblings. Header and footer stay outside `<main>` so the skip link skips
 * them and they are the page's banner and contentinfo landmarks.
 *
 * Each sits in its own `.wrap` because `.wrap > .bleed` is what spans the
 * grid; the header and footer are bleeds and need a `.wrap` as direct parent.
 */
export default function Shell({
  current,
  className,
  children,
}: {
  current?: Section;
  /** Extra classes for `<main>`, beside `wrap`. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="wrap"><Nav current={current} /></div>
      <main id="main" className={className ? `wrap ${className}` : "wrap"}>
        {children}
      </main>
      <div className="wrap"><Footer /></div>
    </>
  );
}
