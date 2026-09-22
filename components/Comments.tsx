"use client";

import { useEffect, useRef, useState } from "react";

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
 * **It degrades to something, not to a hole.** The heading and the link to the
 * thread are server-rendered, so a reader with JavaScript off — or one whose
 * request for the widget fails, which is the likelier case — still sees that
 * discussion exists and still has a way into it. A `<div>` that stays empty
 * would be the version of this component that does not belong on the site.
 *
 * The script is injected rather than imported because it is not part of this
 * bundle: it is served by another process on the same origin, exists only in
 * production, and must not be something the build tries to resolve.
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
    REMARK42?: { destroy?: () => void };
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

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function Comments({ url }: { url: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    const host = `${window.location.origin}${PATH}`;

    window.remark_config = {
      host,
      site_id: SITE_ID,
      // The canonical URL, so a thread is not forked by a query string or a
      // missing trailing slash. Both spellings must resolve to one thread.
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
    // The backend being down must not look like the feature not existing.
    script.onerror = () => !cancelled && setState("failed");
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      try { window.REMARK42?.destroy?.(); } catch { /* already gone */ }
      script.remove();
      const node = mount.current;
      if (node) node.innerHTML = "";
    };
  }, [url]);

  // Follow the theme toggle without remounting the thread.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (window.remark_config) window.remark_config.theme = currentTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="row comments" id="comments">
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
