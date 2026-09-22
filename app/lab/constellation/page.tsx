import type { Metadata } from "next";
import Link from "next/link";
import Constellation from "@/components/lab/Constellation";

export const metadata: Metadata = {
  title: "Lab — constellation",
  robots: { index: false, follow: false },
};

/**
 * A direction for /stack/, full-bleed and on its own. Not linked from the site
 * and not in the sitemap: three of these exist so one can be chosen.
 */
export default function Page() {
  return (
    <main id="main" className="lab lab--constellation">
      <header className="lab-head">
        <Link href="/lab/" className="lab-back">lab</Link>
        <h1>constellation</h1>
      </header>

      <Constellation />
      <p className="lab-blurb">IDEA ONE — a sky. Atmospheric, spatial, brightness from the measurement.</p>
    </main>
  );
}
