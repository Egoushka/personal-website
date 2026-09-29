import { kindLabel } from "@/lib/post-kinds.mjs";
import type { PostKind } from "@/lib/posts";

/**
 * A post's kind, where a reader decides whether to open it: a row in a list, and
 * the facts under a post's title. Only a note is named (lib/post-kinds.mjs).
 * Filled, not outlined: the outlined chip beside it is a link, and this is a
 * fact. Plain class strings, like StatusBadge: the writing filter renders it in
 * the browser, and `cn()` or `badgeVariants` would ship tailwind-merge with it.
 */
export default function KindLabel({ kind }: { kind?: PostKind }) {
  const label = kindLabel(kind);
  if (!label) return null;
  return (
    <span className="inline-flex w-fit shrink-0 items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-foreground">
      {label}
    </span>
  );
}
