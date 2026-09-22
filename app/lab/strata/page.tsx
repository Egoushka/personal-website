import type { Metadata } from "next";
import Link from "next/link";
import Strata from "@/components/lab/Strata";

export const metadata: Metadata = {
  title: "Lab — strata",
  robots: { index: false, follow: false },
};

/**
 * A direction for /stack/, full-bleed and on its own. Not linked from the site
 * and not in the sitemap: three of these exist so one can be chosen.
 */
export default function Page() {
  // The axis ends today, and the build is the only clock this site has.
  const nowYear = new Date().getFullYear() + new Date().getMonth() / 12;

  return (
    <main id="main" className="lab lab--strata">
      <header className="lab-head">
        <Link href="/lab/" className="lab-back">lab</Link>
        <h1>strata</h1>
      </header>

      <Strata nowYear={nowYear} />
      <p className="lab-blurb">IDEA THREE — time. When each thing was acquired, from the record.</p>
    </main>
  );
}
