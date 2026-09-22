"use client";

import { useEffect, useState } from "react";

/**
 * The CV's print control.
 *
 * It was a static line of text telling the reader to press Ctrl/⌘ + P — which
 * named both modifiers because the page could not know which one applied, and
 * asked the reader to do by hand the one thing this page exists for.
 *
 * Now it is a button, and the shortcut beside it names the key that actually
 * works on the machine reading it.
 *
 * **It must render before JS does.** The server sends the keyboard hint, which
 * is true everywhere and needs nothing to work; the effect upgrades it to a
 * button once the platform is known. Rendering the button on the server and
 * correcting it afterwards would mean the first paint disagrees with the
 * second, which is the hydration mismatch this codebase already has a rule
 * about — see the note on `Math.random()` in CLAUDE.md.
 *
 * Detection prefers `navigator.userAgentData.platform`, which is the only one
 * of these that is not deprecated and is not part of the frozen user-agent
 * string. `navigator.platform` is the fallback and is still accurate for the
 * one question being asked: is the command key called Command. Nothing else is
 * inferred from it, nothing is sent anywhere, and a wrong answer costs the
 * reader one wrong glyph next to a button that still works.
 */

type Platform = { key: string; label: string };

const MAC: Platform = { key: "⌘", label: "Command" };
const PC: Platform = { key: "Ctrl", label: "Control" };

function detect(): Platform {
  if (typeof navigator === "undefined") return PC;
  // `userAgentData` is Chromium-only; the optional chain covers everyone else.
  const hinted = (navigator as Navigator & {
    userAgentData?: { platform?: string };
  }).userAgentData?.platform;
  const raw = hinted || navigator.platform || navigator.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(raw) ? MAC : PC;
}

export default function PrintCv() {
  // null until the browser has been asked — that is the server's render too.
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => setPlatform(detect()), []);

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
