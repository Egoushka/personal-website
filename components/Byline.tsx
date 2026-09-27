import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Who wrote this and how to reach me, where a reader finishes: a post or a
 * project page. The address is the link's visible text, not only its target,
 * so a desktop with no mail handler still shows something to copy; the subject
 * is the page's title, so a message says what it is about.
 *
 * The spaces between items are deliberate. `.run` sets the visual gap, but
 * without a text node between them extracted text runs the items together.
 */
export default function Byline({ title }: { title: string }) {
  return (
    <p className="byline run">
      <span>{site.name}</span>{" "}
      <span>{site.availability}</span>{" "}
      <a href={`mailto:${site.email}?subject=${encodeURIComponent(title)}`}>{site.email}</a>{" "}
      <Link prefetch={false} href="/about/#contact">working with me</Link>
    </p>
  );
}
