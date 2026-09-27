/**
 * Which modifier key the reader's machine calls the command key.
 *
 * Browser-only: call it from an effect, never during render, so the server's
 * HTML and the first client render agree.
 *
 * Detection prefers `navigator.userAgentData.platform`, which is the only one
 * of these that is not deprecated and is not part of the frozen user-agent
 * string. `navigator.platform` is the fallback and is still accurate for the
 * one question being asked. Nothing else is inferred from it, nothing is sent
 * anywhere, and a wrong answer costs the reader one wrong glyph.
 */
export type Platform = { key: string; label: string };

export const MAC: Platform = { key: "⌘", label: "Command" };
export const PC: Platform = { key: "Ctrl", label: "Control" };

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return PC;
  // `userAgentData` is Chromium-only; the optional chain covers everyone else.
  const hinted = (navigator as Navigator & {
    userAgentData?: { platform?: string };
  }).userAgentData?.platform;
  const raw = hinted || navigator.platform || navigator.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(raw) ? MAC : PC;
}
