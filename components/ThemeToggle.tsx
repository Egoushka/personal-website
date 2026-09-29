"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/ui/icons";

type Theme = "dark" | "light";

const LIGHT = "(prefers-color-scheme: light)";

/** One box for the button and its placeholder, so the header is laid out once. */
const BOX = "inline-flex size-8 items-center justify-center rounded-md border border-input";

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
 * No third state: "system" is what having made no choice already means. The
 * icon shows the theme it switches TO; the accessible name says so in words.
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
      setTheme(media.matches ? "light" : "dark");
    };
    follow();
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  if (!theme) {
    return <span className={`theme-toggle theme-toggle--pending ${BOX}`} aria-hidden="true" />;
  }

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${BOX} cursor-pointer text-muted-foreground transition-colors hover:bg-accent hover:text-foreground`}
      aria-label={`Switch to the ${next} theme`}
      title={`Switch to the ${next} theme`}
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
      {next === "light" ? <Sun /> : <Moon />}
    </button>
  );
}
