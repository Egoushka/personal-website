/**
 * The behaviour of the figures in a post (ADR 0010): draw-in on scroll, values
 * on hover and focus, and series toggles in a legend. Plain DOM code over the
 * markup components/Figure.tsx writes; it imports nothing of the figures'.
 * Loaded by components/FigureEnhancements.tsx, and only on a page with a figure.
 * Returns what undoes it.
 */
export function mountFigures(): () => void {
  const figs = Array.from(document.querySelectorAll<HTMLElement>("figure[data-fig]"));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = <T extends Element>(el: Element, sel: string) => el.querySelector<T>(sel);
  const marks = (fig: Element) =>
    Array.from(fig.querySelectorAll<SVGElement>(".fig-mark, .fig-node")).filter((m) => !m.classList.contains("is-off"));

  // Legend entries become toggles. The page stays complete without them.
  for (const key of document.querySelectorAll<HTMLElement>("figure[data-fig] .fig-key")) {
    key.tabIndex = 0;
    key.setAttribute("role", "button");
    key.setAttribute("aria-pressed", "true");
  }
  function toggle(key: HTMLElement) {
    const fig = key.closest("figure")!;
    const on = key.getAttribute("aria-pressed") === "false";
    const keys = Array.from(fig.querySelectorAll<HTMLElement>(".fig-key"));
    // The last series on show stays: an empty chart says nothing.
    if (!on && keys.filter((k) => k.getAttribute("aria-pressed") === "true").length === 1) return;
    key.setAttribute("aria-pressed", String(on));
    fig.querySelectorAll(`[data-s="${key.dataset.key}"]`).forEach((el) => el.classList.toggle("is-off", !on));
    hide(fig);
  }

  function show(fig: HTMLElement, mark: Element) {
    hide(fig);
    mark.classList.add("is-on");
    const tip = (mark as HTMLElement | SVGElement).dataset.tip ?? "";
    const read = q(fig, ".fig-read");
    if (read) read.textContent = tip;
    const box = q<HTMLElement>(fig, ".fig-tip");
    const plot = q<HTMLElement>(fig, ".fig-plot");
    if (box && plot) {
      box.textContent = tip;
      box.hidden = false;
      const m = mark.getBoundingClientRect();
      const p = plot.getBoundingClientRect();
      const left = m.left - p.left + plot.scrollLeft + m.width / 2 - box.offsetWidth / 2;
      const max = plot.scrollLeft + plot.clientWidth - box.offsetWidth - 4;
      box.style.left = `${Math.max(plot.scrollLeft + 4, Math.min(left, max))}px`;
      const above = m.top - p.top - box.offsetHeight - 8;
      box.style.top = `${above >= 4 ? above : m.bottom - p.top + 8}px`;
    }
    if (fig.dataset.fig === "diagram") {
      const id = (mark as SVGElement).dataset.id;
      fig.classList.add("is-focus");
      fig.querySelectorAll<SVGElement>(".fig-edge").forEach((e) => {
        const near = e.dataset.from === id || e.dataset.to === id;
        e.classList.toggle("is-on", near);
        if (near) {
          fig.querySelector(`.fig-node[data-id="${e.dataset.from === id ? e.dataset.to : e.dataset.from}"]`)?.classList.add("is-near");
        }
      });
    }
  }
  function hide(fig: Element) {
    fig.querySelectorAll(".is-on, .is-near").forEach((el) => el.classList.remove("is-on", "is-near"));
    fig.classList.remove("is-focus");
    const box = q<HTMLElement>(fig, ".fig-tip");
    if (box) box.hidden = true;
  }

  const up = (e: Event, sel: string) => (e.target instanceof Element ? e.target.closest<HTMLElement>(sel) : null);
  const figOf = (e: Event) => up(e, "figure[data-fig]");
  const markOf = (e: Event) => up(e, ".fig-mark, .fig-node");

  const onOver = (e: PointerEvent) => {
    const fig = figOf(e);
    const mark = markOf(e);
    if (fig && mark && !mark.classList.contains("is-off")) show(fig, mark);
  };
  const onOut = (e: PointerEvent) => {
    // A finger lifting is not leaving; the next touch elsewhere clears it.
    const fig = figOf(e);
    if (fig && e.pointerType === "mouse" && markOf(e) && document.activeElement !== q(fig, ".fig-plot")) hide(fig);
  };
  const onDown = (e: PointerEvent) => {
    for (const fig of figs) if (!markOf(e) || figOf(e) !== fig) hide(fig);
  };
  const onClick = (e: MouseEvent) => {
    const key = up(e, ".fig-key[role=button]");
    if (key) toggle(key);
  };
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.matches(".fig-key[role=button]") && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return toggle(t);
    }
    const fig = figOf(e);
    if (!fig || !t.matches(".fig-plot")) return;
    if (e.key === "Escape") return hide(fig);
    const all = marks(fig);
    const now = all.findIndex((m) => m.classList.contains("is-on"));
    const next = { ArrowRight: now + 1, ArrowDown: now + 1, ArrowLeft: now - 1, ArrowUp: now - 1, Home: 0, End: all.length - 1 }[e.key];
    if (next === undefined || all.length === 0) return;
    e.preventDefault();
    show(fig, all[Math.max(0, Math.min(next, all.length - 1))]);
  };
  const onBlur = (e: FocusEvent) => {
    const fig = figOf(e);
    if (fig && (e.target as Element).matches(".fig-plot")) hide(fig);
  };

  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  document.addEventListener("pointerdown", onDown);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("focusout", onBlur);

  // Draw-in: armed only for a figure still below the fold; one already on
  // screen is not erased to be drawn again.
  // Once drawn the classes go, so a later hover is not delayed by the draw-in's stagger.
  const seen = new Set<Element>();
  const timers: number[] = [];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const fig = e.target as HTMLElement;
        if (!seen.has(fig)) {
          seen.add(fig);
          if (e.isIntersecting) io.unobserve(fig);
          else fig.classList.add("is-armed");
        } else if (e.isIntersecting) {
          fig.classList.add("is-drawn");
          io.unobserve(fig);
          timers.push(window.setTimeout(() => fig.classList.remove("is-armed", "is-drawn"), 3000));
        }
      }
    },
    { threshold: 0.2 },
  );
  if (!still) figs.forEach((f) => io.observe(f));

  return () => {
    io.disconnect();
    timers.forEach((t) => window.clearTimeout(t));
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("focusout", onBlur);
  };
}
