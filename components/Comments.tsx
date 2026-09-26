"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Comments and reactions, self-hosted.
 *
 * Every drop-in option for this — Giscus, utterances, Disqus — is blocked by
 * this site's own CSP, and not awkwardly: `script-src 'self'` stops the
 * widget loading and `connect-src 'self'` stops it talking home. That is the
 * policy working, so the answer is the same one Umami already uses: run the
 * thing yourself and serve it first-party through the edge, at a path on this
 * domain. Third-party origins stay at zero and the CSP does not move.
 *
 * The backend is Remark42 at `/c/` on this host. It carries the identity
 * (GitHub sign-in), the moderation queue and the vote counts; none of that
 * belongs in a static export and none of it is reimplemented here.
 *
 * **It degrades to something, not to a hole.** The heading is server-rendered
 * and a note appears if the backend is unreachable, so a reader with
 * JavaScript off — or one whose request for the widget fails, the likelier
 * case — still sees that discussion exists. A `<div>` that stays empty would
 * be the version of this component that does not belong on the site.
 *
 * The script is injected rather than imported because it is not part of this
 * bundle: it is served by another process on the same origin, exists only in
 * production, and must not be something the build tries to resolve.
 *
 * **It loads when the reader gets near it**, not with the post: most readers
 * never reach the thread, and the widget is the heaviest thing on the page.
 * An IntersectionObserver starts it once the section is within NEAR of the
 * viewport. A `#comments` link scrolls the section into view, which is the
 * same trigger. The reserved height means the load itself moves nothing.
 */

declare global {
  interface Window {
    remark_config?: {
      host: string;
      site_id: string;
      url: string;
      components: string[];
      theme: "light" | "dark";
      locale: string;
      show_email_subscription: boolean;
    };
    REMARK42?: {
      changeTheme?: (t: "light" | "dark") => void;
      destroy?: () => void;
    };
  }
}

/**
 * Same origin, proxied at the edge — never a remark42.example.com.
 *
 * It has to be ABSOLUTE. A relative "/c" is same-origin and reads fine, and
 * the widget rejects it outright with "Remark42: Invalid host URL" — it
 * parses this as a URL to derive the iframe origin, so a path alone has
 * nothing to parse. Built from `location.origin` at mount so there is still
 * no hostname written down anywhere, and dev, staging and production each
 * point at themselves.
 */
const PATH = "/c";
const SITE_ID = "hrabovskyi";
const NEAR = "800px";

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/* ---------------------------------------------------------------------------
   Painting the widget in this site's colours.

   Remark42 ships a proper set of semantic custom properties — --primary-color,
   --primary-text-color, --line-color and so on — which is a far better seam
   than overriding its class names, because names churn between releases and
   these have not.

   Most of them are RGB TRIPLETS ("0,170,170"), not colours, because the widget
   composes them with alpha as `rgba(var(--primary-color), .5)`. Handing one a
   hex string silently produces an invalid colour and the rule is dropped.

   The values are read from THIS page's computed styles rather than restated
   here, so globals.css stays the only place the palette is written down. Edit
   a token there and the widget follows on the next paint.
   ------------------------------------------------------------------------ */

/**
 * Resolve a token to a real colour.
 *
 * Reading the property off `documentElement` is not enough: `--surface` is a
 * `color-mix()` and getComputedStyle hands back the unevaluated expression,
 * which is useless as a triplet. Painting it onto a throwaway element makes
 * the engine actually compute it, and `color` always resolves to `rgb(...)`.
 */
function resolve(token: string): string {
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = `position:absolute;left:-9999px;color:var(${token})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** "rgb(242, 160, 61)" -> "242, 160, 61", which is the shape Remark42 wants. */
function triplet(token: string): string | null {
  const m = resolve(token).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  return m ? `${Math.round(+m[1])}, ${Math.round(+m[2])}, ${Math.round(+m[3])}` : null;
}

/** For the handful of its variables that want a colour, not a triplet. */
function colorOf(token: string): string {
  return resolve(token);
}

function themeCss(): string {
  const accent = triplet("--accent");
  const ink = triplet("--ink");
  const ink2 = triplet("--ink-2");
  const paper = triplet("--paper");
  const rule = triplet("--rule");
  const ruleFirm = triplet("--rule-firm");
  if (!accent || !ink || !ink2 || !paper || !rule || !ruleFirm) return "";

  const surface = colorOf("--surface");
  const ruleC = colorOf("--rule");

  /* Remark42 declares its dark values on `:root .dark` — and `.dark` is on
     BOTH <body> and an inner wrapper div, so overriding only `body.dark`
     leaves the inner one redeclaring the teal for everything below it. That
     is what left the sign-in button teal while the rest of the widget had
     already turned amber. Mirror their selector exactly and win on order.

     Every selector carries the SAME values: the widget is only ever in the
     theme this page is in, and this sheet is rewritten when that changes. */
  const sel = ":root, :root body, :root .dark";

  return `${sel} {
  --primary-color: ${accent};
  --primary-brighter-color: ${accent};
  --primary-darker-color: ${accent};
  --primary-text-color: ${ink};
  --text-color: ${ink};
  --secondary-text-color: ${ink2};
  --secondary-darker-text-color: ${ink2};
  --primary-background-color: ${paper};
  --line-color: ${rule};
  --line-brighter-color: ${ruleFirm};
  --error-color: ${colorOf("--warn")};

  /* The panel. Remark42 keeps its surfaces as raw colours rather than semantic
     ones, so the comment box sat at its own #262626 regardless of
     --primary-background-color.

     ONLY the four confirmed by reading the widget's own rules. A first pass
     mapped seventeen of these greys by their hex looking line-ish, and two of
     them turned out to be TEXT in dark mode: the formatting toolbar and the
     "styling with Markdown is supported" line both went invisible against the
     background they had just been recoloured to match. Read the rule before
     mapping the colour. */
  --color8:  ${surface};
  --color22: ${surface};
  --color24: ${surface};
  --color7:  ${ruleC};

  /* The raw teals the semantic set does not reach: links, the active tab
     underline, the selected-sort marker, and the two translucent focus rings. */
  --color9:  ${colorOf("--accent")};
  --color15: ${colorOf("--accent")};
  --color33: ${colorOf("--accent")};
  --color29: ${colorOf("--accent")};
  --color47: rgba(${accent}, .4);
  --color48: rgba(${accent}, .6);
  --color3:  rgba(${accent}, .14);
  --color4:  rgba(${accent}, .08);
  --color40: rgba(${accent}, .5);
  --color42: rgba(${accent}, .18);
  --color43: rgba(${accent}, .3);
}
${sel} { color-scheme: ${currentTheme()}; }`;
}

/** Inject or refresh the override sheet inside the widget's document. */
function paint(doc: Document | null | undefined) {
  if (!doc?.head) return;
  const css = themeCss();
  if (!css) return;
  let el = doc.getElementById("site-theme") as HTMLStyleElement | null;
  if (!el) {
    el = doc.createElement("style");
    el.id = "site-theme";
    doc.head.appendChild(el); // last, so equal specificity still wins
  }
  if (el.textContent !== css) el.textContent = css;
}

export default function Comments({ url }: { url: string }) {
  const section = useRef<HTMLElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const near = state !== "idle";

  useEffect(() => {
    const el = section.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        setState("loading");
      }
    }, { rootMargin: `${NEAR} 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  /** The widget's iframe is same-origin, so its document is reachable. */
  const paintWidget = useCallback(() => {
    const frame = mount.current?.querySelector("iframe");
    if (!frame) return false;
    try {
      paint(frame.contentDocument);
      return true;
    } catch {
      return false; // cross-origin or torn down mid-call
    }
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;

    const host = `${window.location.origin}${PATH}`;

    window.remark_config = {
      host,
      site_id: SITE_ID,
      url,
      components: ["embed"],
      theme: currentTheme(),
      locale: "en",
      // No email capture. GitHub sign-in already carries identity, and an
      // address is personal data this site has no reason to hold.
      show_email_subscription: false,
    };

    const script = document.createElement("script");
    script.src = `${host}/web/embed.js`;
    script.defer = true;
    script.onload = () => !cancelled && setState("ready");
    script.onerror = () => !cancelled && setState("failed");
    document.body.appendChild(script);

    /* The iframe is created by the widget and then rewritten by its own app,
       so there is no single load event to hang this on. Watch the mount until
       a document exists, paint it, and keep watching — the widget replaces its
       body on sign-in and on every re-render. */
    const observer = new MutationObserver(() => paintWidget());
    if (mount.current) observer.observe(mount.current, { childList: true, subtree: true });

    const poll = window.setInterval(() => {
      if (cancelled) return;
      const frame = mount.current?.querySelector("iframe");
      if (!frame) return;
      paintWidget();
      frame.addEventListener("load", paintWidget);
    }, 250);
    // Stop polling once it has had long enough to settle; the observer stays.
    const stop = window.setTimeout(() => window.clearInterval(poll), 8000);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearInterval(poll);
      window.clearTimeout(stop);
      try { window.REMARK42?.destroy?.(); } catch { /* already gone */ }
      script.remove();
      const node = mount.current;
      if (node) node.innerHTML = "";
    };
  }, [near, url, paintWidget]);

  /* Follow the site's theme toggle.

     `remark_config.theme` is read once at start-up — mutating it later does
     nothing, which is what this used to do. `REMARK42.changeTheme` is the
     actual API. The repaint afterwards is not optional: changing theme
     re-renders the widget and discards the injected stylesheet with it. */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = currentTheme();
      if (window.remark_config) window.remark_config.theme = t;
      try { window.REMARK42?.changeTheme?.(t); } catch { /* not up yet */ }
      // After its own re-render, not before.
      requestAnimationFrame(() => { paintWidget(); setTimeout(paintWidget, 120); });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [paintWidget]);

  return (
    <section className="row comments" id="comments" ref={section} data-pagefind-ignore>
      <h2 className="rail rail--label">Comments</h2>
      <div>
        {state === "failed" && (
          <p className="comments-note">
            The comment service is not answering. It runs on the same box as
            everything else here, so this is my problem rather than yours —
            the post is unaffected.
          </p>
        )}
        <noscript>
          <p className="comments-note">
            Comments need JavaScript. They are served from this domain, not a
            third party, and sign-in is through GitHub.
          </p>
        </noscript>
        <div id="remark42" ref={mount} />
      </div>
    </section>
  );
}
