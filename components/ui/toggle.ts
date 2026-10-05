/**
 * Toggle styles for the list filters (shadcn/ui's toggle and toggle-group
 * looks, without Radix: a plain `<button aria-pressed>` is all a static list
 * needs). `filter-chip` and `sort-btn` stay as hooks: globals.css hides them
 * with JavaScript off, and the smoke test looks for them.
 */
export const chip =
  "filter-chip inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground";

/** No opacity: muted at 70% is 4.1:1 on the background, under AA (axe skips one-digit counts). */
export const chipCount = "text-xs tabular-nums";

export const segment = "inline-flex items-center gap-0.5 rounded-lg border border-input p-0.5";

export const segmentButton =
  "sort-btn inline-flex h-7 cursor-pointer items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground";
