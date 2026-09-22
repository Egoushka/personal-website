"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * The manual theme switch.
 *
 * Both themes already existed and the OS already chose between them — see the
 * top of globals.css. This adds the one thing `prefers-color-scheme` cannot: a
 * reader on a bright screen whose machine is set to dark, which is most people
 * reading a work page at a desk in an office.
 *
 * It renders **nothing** until it has mounted. A control that cannot work
 * without JavaScript should not be painted before JavaScript arrives, and the
 * site is fully themed without it: the pre-paint script in app/layout.tsx
 * applies a stored choice, and the media query covers everyone who has never
 * made one. Deliberately no icon — nothing else in this design is one — and no
 * third state, because "system" is what having made no choice already means.
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
    setTheme(
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark",
    );
  }, []);

  if (!theme) return null;

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
