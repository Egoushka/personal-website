"use client";

import { useEffect } from "react";

/**
 * The browser side of the figures in a post (ADR 0010). Renders nothing: the
 * server drew every figure in its final state (components/Figure.tsx), so with
 * this gone, or with JavaScript off, a figure is the same figure.
 *
 * Prose mounts it only when the post has a figure, and it loads the behaviour
 * (components/figure-island.ts) with a native import(), a chunk of its own that
 * only a page with a figure ever fetches. The shim is all a post without one
 * carries, because a route's client components are in its first-load JS
 * whether or not they render.
 */
export default function FigureEnhancements() {
  useEffect(() => {
    let off: (() => void) | undefined;
    let gone = false;
    import("./figure-island").then((m) => {
      if (!gone) off = m.mountFigures();
    });
    return () => {
      gone = true;
      off?.();
    };
  }, []);

  return null;
}
