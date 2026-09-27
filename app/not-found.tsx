import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";

// Through the layout's template: "Not found — Yehor Hrabovskyi".
export const metadata: Metadata = { title: "Not found" };

/** The joke is from the deploy post. It earns its place on exactly one page. */
export default function NotFound() {
  return (
    <Shell>
      <span className="rail rail--against-body">404</span>
      <div className="notfound">
        <h1>404</h1>
        <p>
          Nothing at this address. It answered, but it isn&apos;t listening.
        </p>
        <p className="page-figures">
          <span><Link prefetch={false} href="/">home</Link></span>{" "}
          <span><Link prefetch={false} href="/writing/">writing</Link></span>{" "}
          <span><Link prefetch={false} href="/projects/">projects</Link></span>
        </p>
      </div>
    </Shell>
  );
}
