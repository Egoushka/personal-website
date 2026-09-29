import * as React from "react";

/** shadcn/ui's keyboard key. Plain class strings: the search dialog renders it in the browser. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={`pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm border bg-muted px-1 font-sans text-[0.6875rem] font-medium text-muted-foreground select-none ${className ?? ""}`}
      {...props}
    />
  );
}
