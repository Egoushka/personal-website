/**
 * Where a project stands: a word and a dot. The word carries it; the dot only
 * helps a list scan. Plain class strings, not `cn()` or `badgeVariants`: the
 * projects filter renders this in the browser, and those would ship
 * tailwind-merge and cva to every visitor for one badge.
 */
const DOT = {
  running: "bg-success",
  building: "bg-warning",
  paused: "bg-muted-foreground",
} as const;

export default function StatusBadge({
  status,
  className = "",
}: {
  status: keyof typeof DOT;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap capitalize ${className}`}
    >
      <span className={`size-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      {status}
    </span>
  );
}
