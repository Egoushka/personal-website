// The "flying website" easter egg. Loaded by the inline loader in app/layout.tsx
// (lib/flying.ts) only after five quick theme-toggle clicks, so a normal page view
// never fetches it. It lifts the page's blocks off the page: drag them, or focus a
// block's grip and use the arrow keys. Escape or "Land the site" puts everything
// back and removes what this file added. Nothing is stored or sent but one Umami event.

const CSS = `
.fly-on{overflow-x:clip}
.fly-rel{position:relative}
.fly-block{background:var(--background);border-radius:.75rem;
  box-shadow:0 0 0 1px var(--border),0 16px 36px -12px oklch(0 0 0/.5);
  animation:fly-bob 4.2s ease-in-out infinite alternate;animation-delay:calc(var(--i)*-.7s)}
.fly-block.fly-held{animation:none;cursor:grabbing;user-select:none}
.fly-block.fly-mouse{cursor:grab}
.fly-block.fly-held{box-shadow:0 0 0 1px var(--ring),0 28px 56px -12px oklch(0 0 0/.6)}
@keyframes fly-bob{from{translate:0 -4px}to{translate:0 5px}}
@media (prefers-reduced-motion:reduce){.fly-block{animation:none}}
.fly-grip{position:absolute;top:.5rem;right:.5rem;z-index:2;display:grid;place-items:center;
  width:2.5rem;height:2.5rem;border-radius:.5rem;border:1px solid var(--input);
  background:var(--card);color:var(--muted-foreground);cursor:grab;touch-action:none}
.fly-grip:hover{color:var(--foreground)}
.fly-grip:focus-visible{outline:2px solid var(--ring);outline-offset:2px}
.fly-bar{position:fixed;left:50%;bottom:1rem;z-index:2147483000;transform:translateX(-50%);
  display:flex;align-items:center;gap:.75rem;max-width:calc(100vw - 1.5rem);padding:.5rem .5rem .5rem 1rem;
  border-radius:.75rem;background:var(--card);color:var(--foreground);
  box-shadow:0 0 0 1px var(--border),0 12px 32px -8px oklch(0 0 0/.55);font-size:.875rem}
.fly-bar button{white-space:nowrap;flex:none}
@media (max-width:480px){.fly-bar [role=status]{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.fly-bar{padding:.5rem}}
`;

const STEP = 16;
const BIG_STEP = 64;
const MARGIN = 48;
const MS = 600;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const GRIP =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
  [4, 8, 12].flatMap((y) => [5, 11].map((x) => `<circle cx="${x}" cy="${y}" r="1.2"/>`)).join("") +
  "</svg>";

let session = null;

/** Blocks to fly: the page's direct sections, a lone wrapper looked through, and the footer. */
export function pickBlocks(root = document) {
  let host = root.getElementById("main");
  for (let i = 0; host && host.children.length === 1 && i < 2; i++) host = host.firstElementChild;
  const list = host ? [...host.children] : [];
  const footer = root.querySelector("footer.site-footer");
  if (footer) list.push(footer);
  return list
    .filter((el) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName) && el.offsetHeight > 0)
    .slice(0, 16);
}

function nameOf(el, n) {
  const h = el.matches("h1,h2,h3") ? el : el.querySelector("h1,h2,h3");
  return (h && h.textContent.trim().slice(0, 60)) || `section ${n}`;
}

export function fly() {
  if (session) return;
  const blocks = pickBlocks();
  if (!blocks.length) return;

  const opener = document.activeElement;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  document.documentElement.classList.add("fly-on");

  const ctl = new AbortController();
  const { signal } = ctl;
  const items = blocks.map((el, i) => {
    const s = {
      el,
      i,
      x: 0,
      y: 0,
      r: 0,
      saved: el.getAttribute("style"),
      grip: document.createElement("button"),
    };
    // The page's own positioning (a sticky block) is left alone; it still takes a transform.
    el.classList.add("fly-block");
    if (getComputedStyle(el).position === "static") el.classList.add("fly-rel");
    el.style.setProperty("--i", String(i));
    s.grip.type = "button";
    s.grip.className = "fly-grip";
    s.grip.innerHTML = GRIP;
    s.grip.setAttribute("aria-label", `Move ${nameOf(el, i + 1)}: arrow keys move it, Escape lands the site`);
    el.append(s.grip);
    return s;
  });

  const put = (s, ease) => {
    s.el.style.transition = ease ? `transform ${MS}ms ${EASE}` : "none";
    s.el.style.transform = `translate(${s.x}px,${s.y}px) rotate(${s.r}deg)`;
  };
  // Where a block sits when not moved, so a drag can be kept on screen.
  const clamp = (s, x, y) => {
    const r = s.el.getBoundingClientRect();
    const left = r.left - s.x + scrollX;
    const top = r.top - s.y + scrollY;
    const doc = document.documentElement;
    return [
      Math.min(Math.max(x, MARGIN - r.width - left), doc.clientWidth - MARGIN - left),
      Math.min(Math.max(y, -top), doc.scrollHeight - MARGIN - top),
    ];
  };
  const move = (s, x, y) => {
    [s.x, s.y] = clamp(s, x, y);
    put(s, false);
  };
  const lift = (s) => {
    s.el.style.zIndex = String(10 + ++z);
  };
  let z = 0;

  // Lift off: every block takes a small tilt and a nudge.
  const animate = !reduced();
  for (const s of items) {
    s.r = (Math.random() - 0.5) * 5;
    [s.x, s.y] = clamp(s, (Math.random() - 0.5) * 48, (Math.random() - 0.5) * 24);
    put(s, animate);
  }
  const settle = setTimeout(() => items.forEach((s) => (s.el.style.transition = "none")), MS + 50);

  const bar = document.createElement("div");
  bar.className = "fly-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Flying website");
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  status.textContent = "The site is flying. Drag the pieces.";
  const exit = document.createElement("button");
  exit.type = "button";
  exit.className = "key key-sm";
  exit.textContent = "Land the site (Esc)";
  bar.append(status, exit);
  document.body.append(bar);
  exit.focus({ preventScroll: true });

  let drag = null;
  let dragged = false;
  document.addEventListener(
    "click",
    (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
    },
    { signal, capture: true },
  );
  const byEl = (t) => items.find((s) => s.el.contains(t));
  document.addEventListener(
    "pointerdown",
    (e) => {
      const s = byEl(e.target);
      if (!s || e.button !== 0) return;
      const onGrip = s.grip.contains(e.target);
      const plain = e.pointerType === "mouse" && !e.target.closest("a,button,input,textarea,select,summary,[contenteditable]");
      if (!onGrip && !plain) return;
      drag = { s, px: e.clientX, py: e.clientY, x: s.x, y: s.y, moved: false, id: e.pointerId, src: onGrip ? s.grip : s.el };
      drag.src.setPointerCapture(e.pointerId);
      lift(s);
      s.el.classList.add("fly-held");
    },
    { signal },
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.px;
      const dy = e.clientY - drag.py;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) move(drag.s, drag.x + dx, drag.y + dy);
    },
    { signal },
  );
  const drop = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.s.el.classList.remove("fly-held");
    // A drag that ends on a link must not follow it.
    if (drag.moved) {
      dragged = true;
      setTimeout(() => (dragged = false));
    }
    drag = null;
  };
  document.addEventListener("pointerup", drop, { signal });
  document.addEventListener("pointercancel", drop, { signal });
  document.addEventListener(
    "pointerover",
    (e) => {
      const s = byEl(e.target);
      if (s) s.el.classList.toggle("fly-mouse", e.pointerType === "mouse");
    },
    { signal },
  );
  for (const s of items) {
    s.grip.addEventListener(
      "keydown",
      (e) => {
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!d) return;
        e.preventDefault();
        const k = e.shiftKey ? BIG_STEP : STEP;
        lift(s);
        move(s, s.x + d[0] * k, s.y + d[1] * k);
        s.grip.scrollIntoView({ block: "nearest", inline: "nearest" });
      },
      { signal },
    );
  }

  const land = (instant) => {
    clearTimeout(settle);
    ctl.abort();
    bar.remove();
    const done = () => {
      for (const s of items) {
        s.grip.remove();
        s.el.classList.remove("fly-block", "fly-rel", "fly-held", "fly-mouse");
        if (s.saved === null) s.el.removeAttribute("style");
        else s.el.setAttribute("style", s.saved);
      }
      style.remove();
      document.documentElement.classList.remove("fly-on");
      session = null;
    };
    if (instant || !animate) {
      items.forEach((s) => ((s.el.style.transform = "none"), (s.el.style.transition = "none")));
      done();
    } else {
      items.forEach((s) => {
        s.x = s.y = s.r = 0;
        s.el.style.animation = "none";
        put(s, true);
      });
      setTimeout(done, MS + 50);
    }
    if (opener && opener.isConnected && !instant) opener.focus({ preventScroll: true });
  };
  exit.addEventListener("click", () => land(false), { signal });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) land(false);
    },
    { signal },
  );
  // A client-side navigation swaps the page under us: land at once, before it does.
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (a && a.origin === location.origin && a.pathname !== location.pathname) land(true);
    },
    { signal, capture: true },
  );

  session = { land };
  if (window.umami) window.umami.track("flying-website", { page: location.pathname });
}
