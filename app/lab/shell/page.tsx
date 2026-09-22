import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/lab/Shell";

export const metadata: Metadata = {
  title: "Lab — shell",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main" className="lab lab--shell">
      <header className="lab-head">
        <Link href="/lab/" className="lab-back">lab</Link>
        <h1>shell</h1>
      </header>

      <Shell />

      <p className="lab-blurb">
        IDEA FOUR — a small real shell. It parses what you type and answers from
        the same data every other page reads, with the live figures coming off
        the box. Everything else on this site asks you to look; this asks you to
        do something, and the interface is the argument.
      </p>
    </main>
  );
}
