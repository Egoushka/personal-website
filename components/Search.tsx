"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Site search as a modal over Pagefind's JS API.
 *
 * Not Pagefind's prebuilt UI: that ships its own markup and stylesheet, and
 * restyling someone else's DOM into this design costs more than rendering the
 * results ourselves. The API returns plain data, so the results are ordinary
 * Marginalia rows — rail for the metadata, prose column for the text.
 *
 * `<dialog>` + `showModal()` is doing real work here: focus trap, inertness of
 * the page behind, Esc to close, and a top-layer that no z-index can lose to.
 * All of that would otherwise be hand-written and half-wrong.
 *
 * Pagefind only exists after `next build` — `npm run dev` has no /pagefind/
 * path, so loading fails there by design. The empty state says so rather than
 * looking broken.
 */

type PagefindResult = {
  id: string;
  data: () => Promise<{
    url: string;
    meta?: { title?: string };
    excerpt: string;
  }>;
};

type Pagefind = {
  init: () => Promise<void>;
  debouncedSearch: (q: string, opts?: unknown, ms?: number) =>
    Promise<{ results: PagefindResult[] } | null>;
};

type Hit = { url: string; title: string; excerpt: string };

export default function Search() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefind = useRef<Pagefind | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "ready" | "unavailable">("idle");
  const [active, setActive] = useState(0);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  const show = useCallback(() => {
    dialogRef.current?.showModal();
    setOpen(true);
    // Focus after the dialog is in the top layer, or Safari drops it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // ⌘K / Ctrl+K from anywhere, and "/" when not already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        dialogRef.current?.open ? close() : show();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, close]);

  // Load the index on first open, never on page load: it is ~740 KB of wasm and
  // index shards that most visitors will never ask for.
  useEffect(() => {
    if (!open || pagefind.current || state === "unavailable") return;
    (async () => {
      setState("busy");
      try {
        // Hidden from the bundler on purpose — this path only exists in the
        // built output, so a static import would fail the build.
        const mod = (await (new Function('return import("/pagefind/pagefind.js")')() as Promise<Pagefind>));
        await mod.init();
        pagefind.current = mod;
        setState("ready");
      } catch {
        setState("unavailable");
      }
    })();
  }, [open, state]);

  // `state` is a dependency on purpose: typing starts before the index finishes
  // loading, and without it this never re-runs once Pagefind is ready — the
  // first query silently returns nothing forever.
  useEffect(() => {
    if (!pagefind.current || !query.trim()) {
      setHits([]);
      return;
    }
    let stale = false;
    (async () => {
      const search = await pagefind.current!.debouncedSearch(query, undefined, 200);
      if (!search || stale) return;
      const top = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (stale) return;
      setHits(
        top.map((d) => ({
          url: d.url.replace(/\.html$/, "").replace(/\/index$/, "/"),
          title: d.meta?.title ?? d.url,
          excerpt: d.excerpt,
        })),
      );
      setActive(0);
    })();
    return () => {
      stale = true;
    };
  }, [query, state]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      window.location.href = hits[active].url;
    }
  };

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={show}
        aria-label="Search (Command K)"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="7" cy="7" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
        </svg>
        <span className="search-trigger-key" aria-hidden="true">⌘K</span>
      </button>

      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Search this site"
        onClose={() => setOpen(false)}
        // Clicking the backdrop closes; clicks inside the panel do not bubble here.
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="search-panel">
          <div className="search-field">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search posts and pages"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              aria-label="Search query"
            />
            <kbd>esc</kbd>
          </div>

          <div className="search-results" role="listbox" aria-label="Results">
            {state === "unavailable" && (
              <p className="search-note">
                The search index is only built by <code>npm run build</code>, so it is
                unavailable on the dev server.
              </p>
            )}
            {state !== "unavailable" && query && !hits.length && (
              <p className="search-note">No matches for “{query}”.</p>
            )}
            {!query && (
              <p className="search-note">
                Type to search. <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>↵</kbd> to open.
              </p>
            )}
            {hits.map((h, i) => (
              <a
                key={h.url}
                href={h.url}
                role="option"
                aria-selected={i === active}
                className={`search-hit${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
              >
                {/* deliberately not .rail — that is flex-column and collides
                    with the body text inside a hit row */}
                <span className="search-hit-url">{h.url}</span>
                <span className="search-hit-title">{h.title}</span>
                <span
                  className="search-hit-excerpt"
                  dangerouslySetInnerHTML={{ __html: h.excerpt }}
                />
              </a>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
