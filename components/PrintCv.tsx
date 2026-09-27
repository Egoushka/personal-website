"use client";

import { useEffect, useState } from "react";
import { detectPlatform, type Platform } from "@/lib/platform";

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
      <p className="control print-hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>P</kbd> prints one A4 page
      </p>
    );
  }

  return (
    <p className="print-actions run">
      <button type="button" className="control" onClick={() => window.print()}>
        Save as PDF
      </button>
      <span className="print-hint-key">
        or <kbd>{platform.key}</kbd> + <kbd>P</kbd> — one A4 page
      </span>
    </p>
  );
}
