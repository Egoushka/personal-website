import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { buttonVariants } from "@/components/ui/button";

// Through the layout's template: "Not found — Yehor Hrabovskyi".
export const metadata: Metadata = { title: "Not found" };

/** The joke is from the deploy post. It earns its place on exactly one page. */
export default function NotFound() {
  return (
    <Shell>
      <div className="py-20 md:py-28">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">Nothing at this address.</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">It answered, but it isn&apos;t listening.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link prefetch={false} href="/" className={buttonVariants()}>
            Home
          </Link>
          <Link prefetch={false} href="/writing/" className={buttonVariants({ variant: "outline" })}>
            Writing
          </Link>
          <Link prefetch={false} href="/projects/" className={buttonVariants({ variant: "outline" })}>
            Projects
          </Link>
        </div>
      </div>
    </Shell>
  );
}
