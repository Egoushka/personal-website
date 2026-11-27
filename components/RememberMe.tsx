"use client";

import { useEffect, useState } from "react";
import { readVisitorId, visitorCookie } from "@/lib/umami";

/**
 * The only way a cookie is set for a visitor: an explicit click. Until then the site's analytics set none.
 * "Remember me" stores a random id for 13 months so the owner can see return visits; "Forget me" removes it.
 * No banner, no prompt: it sits in the footer next to the privacy link.
 */
export default function RememberMe() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => setId(readVisitorId(document.cookie)), []);

  const remember = () => {
    const next = crypto.randomUUID();
    document.cookie = visitorCookie(next);
    (window as unknown as { umami?: { identify?: (id: string) => void } }).umami?.identify?.(next);
    setId(next);
  };
  const forget = () => {
    document.cookie = visitorCookie(null);
    setId(null);
  };

  return (
    <button
      type="button"
      onClick={id ? forget : remember}
      aria-pressed={!!id}
      title={id ? "Remove the cookie that lets me recognise you" : "Set one cookie so I can see when you come back"}
      className="inline-flex min-h-8 cursor-pointer items-center rounded-md px-2 transition-colors hover:text-foreground"
    >
      {id ? "Forget me" : "Remember me"}
    </button>
  );
}
