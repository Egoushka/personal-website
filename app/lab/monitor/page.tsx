import type { Metadata } from "next";
import Link from "next/link";
import Monitor from "@/components/lab/Monitor";

export const metadata: Metadata = {
  title: "Lab — monitor",
  robots: { index: false, follow: false },
};

/**
 * A direction for /stack/, full-bleed and on its own. Not linked from the site
 * and not in the sitemap: three of these exist so one can be chosen.
 */
export default function Page() {
  return (
    <main id="main" className="lab lab--monitor">
      <header className="lab-head">
        <Link href="/lab/" className="lab-back">lab</Link>
        <h1>monitor</h1>
      </header>

      <Monitor />
      <p className="lab-blurb">IDEA TWO — an instrument. No diagram at all; the readout of a machine.</p>
    </main>
  );
}
