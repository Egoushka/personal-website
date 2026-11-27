"use client";

import { useEffect, useState } from "react";
import { CHOICE_KEY, UMAMI_OFF_COOKIE, readVisitorId, visitorCookie } from "@/lib/umami";

/**
 * A small first-visit card, bottom corner, never modal: "Remember you when you come back?" Shown once, after a few
 * seconds of reading, and not at all to someone who already chose, to the owner (umami-off) or on a phone-sized
 * print view. "No thanks" is remembered in localStorage so the card does not return; "Remember me" sets the cookie.
 * The footer button stays as the way to change the choice later.
 */
export default function RememberPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (readVisitorId(document.cookie) || localStorage.getItem(CHOICE_KEY)) return;
      if (new RegExp(`(^|; )${UMAMI_OFF_COOKIE}=1`).test(document.cookie)) return;
    } catch {
      return; // storage blocked: do not nag
    }
    const t = setTimeout(() => setShow(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const remember = () => {
    const id = crypto.randomUUID();
    document.cookie = visitorCookie(id);
    (window as unknown as { umami?: { identify?: (id: string) => void } }).umami?.identify?.(id);
    setShow(false);
  };
  const decline = () => {
    try {
      localStorage.setItem(CHOICE_KEY, "no");
    } catch {}
    setShow(false);
  };

  return (
    <aside
      aria-label="Remember me"
      className="fixed bottom-4 left-4 right-4 z-40 max-w-sm rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-lg sm:right-auto print:hidden"
      data-pagefind-ignore
    >
      <p className="font-medium">Remember you when you come back?</p>
      <p className="mt-1 text-muted-foreground">
        One cookie with a random number, so I can see return visits. Nothing else, nothing shared.{" "}
        <a className="link" href="/privacy/">Details</a>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={remember}
          className="inline-flex h-8 cursor-pointer items-center rounded-md bg-brand px-3 font-medium text-brand-foreground hover:bg-brand/90"
        >
          Remember me
        </button>
        <button
          type="button"
          onClick={decline}
          className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3 hover:bg-accent"
        >
          No thanks
        </button>
      </div>
    </aside>
  );
}
