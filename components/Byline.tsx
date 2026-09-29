import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Who wrote this and how to reach me, where a reader finishes: a post or a
 * project page. The address is the link's visible text, not only its target,
 * so a desktop with no mail handler still shows something to copy; the subject
 * is the page's title, so a message says what it is about.
 */
export default function Byline({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn("byline text-sm", className)}>
      <p className="font-medium">{site.name}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <a className="link" href={`mailto:${site.email}?subject=${encodeURIComponent(title)}`}>
          {site.email}
        </a>{" "}
        <Link className="link" prefetch={false} href="/about/#contact">
          working with me
        </Link>
      </p>
    </div>
  );
}
