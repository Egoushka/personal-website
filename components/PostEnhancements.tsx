"use client";

import { useEffect } from "react";

/**
 * The post page's two behaviours: the code blocks' Copy button and the
 * contents list's current-section mark. Renders nothing; both are decoration
 * over markup that already works — with this gone the code is still
 * selectable and the contents list is still a list of working links.
 *
 * Mounted once per post and keyed on the slug, so a soft navigation tears the
 * old listeners down before the next page installs its own. A plain inline
 * script did not: its listeners outlived the page they were written for.
 */
export default function PostEnhancements() {
  useEffect(() => {
    const timers = new Set<number>();

    // One delegated listener rather than one per block: it survives any
    // reconciliation of the code blocks and costs nothing per block.
    function onClick(e: MouseEvent) {
      const button = (e.target as Element | null)?.closest?.(".copy-btn");
      const block = button?.closest("figure.code");
      const pre = block?.querySelector("pre");
      if (!button || !block || !pre) return;
      const status = block.querySelector(".copy-status");
      const code = pre.querySelector("code") ?? pre;
      const say = (text: string, ok: boolean) => {
        // The button shows it; the status span is what a screen reader hears.
        if (status) status.textContent = text;
        button.textContent = ok ? "Copied" : "Failed";
        button.classList.toggle("is-copied", ok);
        const t = window.setTimeout(() => {
          timers.delete(t);
          if (status) status.textContent = "";
          button.textContent = "Copy";
          button.classList.remove("is-copied");
        }, 1600);
        timers.add(t);
      };
      // The clipboard is undefined outside a secure context.
      if (!navigator.clipboard) return say("Copy failed", false);
      navigator.clipboard.writeText((code as HTMLElement).innerText).then(
        () => say("Copied", true),
        () => say("Copy failed", false),
      );
    }
    document.addEventListener("click", onClick);

    const ol = document.querySelector<HTMLOListElement>(".post-aside .toc");
    const links = ol ? Array.from(ol.querySelectorAll("a")) : [];
    const heads = links.map((a) => {
      try { return document.getElementById(decodeURIComponent(a.hash.slice(1))); }
      catch { return null; }
    });
    const box = ol?.closest<HTMLElement>(".post-aside") ?? ol;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cur = -1;
    let frame = 0;

    function mark() {
      frame = 0;
      if (!ol || !box || links.length === 0) return;
      // The last heading whose top has passed the reading line.
      let i = 0;
      heads.forEach((h, j) => { if (h && h.getBoundingClientRect().top <= 140) i = j; });
      if (i === cur) return;
      cur = i;
      links.forEach((a, k) => {
        if (k === i) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      const li = links[i].parentElement as HTMLElement;
      ol.style.setProperty("--toc-y", `${li.offsetTop}px`);
      ol.style.setProperty("--toc-h", `${li.offsetHeight}px`);
      // The rail scrolls on its own once the list outruns the viewport.
      if (box.scrollHeight > box.clientHeight + 1) {
        const top = ol.offsetTop + li.offsetTop - box.clientHeight / 2 + li.offsetHeight / 2;
        box.scrollTo({ top, behavior: still.matches ? "auto" : "smooth" });
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(mark); };
    const onResize = () => { cur = -1; schedule(); };

    if (ol) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      mark();
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}
