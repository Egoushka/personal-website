"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const LIGHT = "(prefers-color-scheme: light)";

/**
 * The manual theme switch.
 *
 * Both themes already existed and the OS already chose between them — see the
 * top of globals.css. This adds the one thing `prefers-color-scheme` cannot: a
 * reader on a bright screen whose machine is set to dark.
 *
 * Until it has mounted it renders an invisible, unfocusable placeholder of the
 * same size, so the header is laid out once and does not move when the button
 * arrives. Server and first client render are that same placeholder. With
 * scripting off, globals.css removes it: a control that cannot work is not
 * painted. The pre-paint script in app/layout.tsx applies a stored choice, and
 * the media query covers everyone who has never made one.
 *
 * Deliberately no icon and no third state: "system" is what having made no
 * choice already means. While no choice is stored, the label follows the OS.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      // Private mode, blocked storage. The OS preference still applies.
    }
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    const media = window.matchMedia(LIGHT);
    const follow = () => {
      // A choice made since mount wins over the OS from then on.
      if (document.documentElement.dataset.theme) return;
      const t: Theme = media.matches ? "light" : "dark";
      setTheme(t);
      // Comments only watch `data-theme`, which an OS change does not touch.
      try { window.REMARK42?.changeTheme?.(t); } catch { /* not loaded */ }
    };
    follow();
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  if (!theme) {
    return (
      <span className="theme-toggle theme-toggle--pending" aria-hidden="true">
        dark
      </span>
    );
  }

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to the ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {
          // The switch still works for this page view; it just will not persist.
        }
        setTheme(next);
      }}
    >
      {next}
    </button>
  );
}
