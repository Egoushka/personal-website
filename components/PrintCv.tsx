"use client";

import { useEffect, useState } from "react";
import { detectPlatform, type Platform } from "@/lib/platform";
import { Download } from "@/components/ui/icons";
import { Kbd } from "@/components/ui/kbd";

/**
 * The CV's print control: a button, and beside it the shortcut named for the
 * machine reading it.
 *
 * **It must render before JS does.** The server sends the keyboard hint, which
 * is true everywhere and needs nothing to work; the effect upgrades it to a
 * button once the platform is known. Rendering the button on the server and
 * correcting it afterwards would make the first paint disagree with the
 * second — a hydration mismatch. Both forms share one `min-block-size` in
 * globals.css, so the swap moves nothing below it.
 */
export default function PrintCv() {
  // null until the browser has been asked — that is the server's render too.
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => setPlatform(detectPlatform()), []);

  if (!platform) {
    return (
      <p className="print-hint mt-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd> + <Kbd>P</Kbd> prints one A4 page
      </p>
    );
  }

  return (
    <p className="print-actions mt-6 flex flex-wrap items-center gap-3">
      {/* The outline button's classes, written out: `buttonVariants` would ship cva
          and tailwind-merge to the browser for one button. */}
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
        onClick={() => window.print()}
        data-umami-event="cv-save-pdf"
      >
        <Download /> Save as PDF
      </button>
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        or <Kbd>{platform.key}</Kbd> + <Kbd>P</Kbd>, one A4 page
      </span>
    </p>
  );
}
