"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPlatform, MAC, type Platform } from "@/lib/platform";
import { Search as SearchIcon } from "@/components/ui/icons";
import { Kbd } from "@/components/ui/kbd";

/**
 * Site search as a modal over Pagefind's JS API.
 *
 * Not Pagefind's prebuilt UI: that ships its own markup and stylesheet, and
 * restyling someone else's DOM into this design costs more than rendering the
 * results ourselves. The API returns plain data, rendered as the site's own rows.
 *
 * `<dialog>` + `showModal()` is doing real work here: focus trap, inertness of
 * the page behind, Esc to close, and a top-layer that no z-index can lose to.
 * All of that would otherwise be hand-written and half-wrong.
 *
 * Pagefind only exists after `next build` — `npm run dev` has no /pagefind/
 * path, so loading fails there by design. On the dev server's port the empty
 * state says why; everywhere else it says only that search is unavailable.
 */

const PAGEFIND = "/pagefind/pagefind.js";

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

/** The last search that finished, and what it found. */
type Found = { query: string; hits: Hit[] };

export default function Search() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefind = useRef<Pagefind | null>(null);
  const failedLoads = useRef(0);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "ready" | "unavailable">("idle");
  const [active, setActive] = useState(0);
  const [platform, setPlatform] = useState<Platform>(MAC);

  const q = query.trim();
  const hits = found?.hits ?? [];
  // Only a search that has finished for what is in the field may say
  // "no matches": while the debounce runs, the last answer stands.
  const settled = !!q && found?.query === q;

  const close = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  const show = useCallback(() => {
    dialogRef.current?.showModal();
    setOpen(true);
    // A failed load is retried on the next open, not remembered for the life
    // of the page. Here rather than in close(): Esc closes the dialog without it.
    setState((s) => (s === "unavailable" ? "idle" : s));
    // Focus after the dialog is in the top layer, or Safari drops it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // The server renders ⌘; a PC reader gets Ctrl once the browser is asked.
  useEffect(() => setPlatform(detectPlatform()), []);

  // ⌘K / Ctrl+K from anywhere. No single-key shortcut: "/" fired for speech
  // input and for anyone typing outside a form field (WCAG 2.1.4).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dialogRef.current?.open ? close() : show();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, close]);

  // Load the index on first open, never on page load: it is wasm and index
  // shards that most visitors will never ask for. Only from "idle" — this
  // effect re-runs when it sets "busy" and must not start a second load.
  useEffect(() => {
    if (!open || pagefind.current || state !== "idle") return;
    (async () => {
      setState("busy");
      try {
        // A real dynamic import the bundler leaves alone: the file only exists
        // in the built output, and a literal specifier fails tsc (TS2307).
        // Never route this through eval or `new Function` — the CSP has no
        // 'unsafe-eval', so that loader throws in production.
        // A retry needs a fresh URL: the browser remembers a failed module
        // fetch for the life of the page and rejects a second import() of it
        // without asking the server. Pagefind's base path ignores the query.
        const url = failedLoads.current ? `${PAGEFIND}?retry=${failedLoads.current}` : PAGEFIND;
        const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)) as Pagefind;
        await mod.init();
        pagefind.current = mod;
        setState("ready");
      } catch {
        failedLoads.current += 1;
        setState("unavailable");
      }
    })();
  }, [open, state]);

  // `state` is a dependency on purpose: typing starts before the index finishes
  // loading, and without it this never re-runs once Pagefind is ready — the
  // first query silently returns nothing forever.
  useEffect(() => {
    if (!q) {
      setFound(null);
      return;
    }
    if (!pagefind.current) return;
    let stale = false;
    (async () => {
      const search = await pagefind.current!.debouncedSearch(q, undefined, 200);
      if (!search || stale) return;
      const top = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (stale) return;
      setFound({
        query: q,
        hits: top.map((d) => ({
          url: d.url.replace(/\.html$/, "").replace(/\/index$/, "/"),
          title: d.meta?.title ?? d.url,
          excerpt: d.excerpt,
        })),
      });
      setActive(0);
    })();
    return () => {
      stale = true;
    };
  }, [q, state]);

  // Keep the active row in view as the arrows move it.
  useEffect(() => {
    document.getElementById(`hit-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, found]);

  const onInputKey = (e: React.KeyboardEvent) => {
    // One Esc closes, even in a filled field, where Chrome's first would
    // only clear it.
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
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

  // Announced, never shown: the list itself is what a sighted reader reads.
  const status =
    state === "unavailable" ? "Search is unavailable right now."
    : state === "busy" && q ? "Loading the index…"
    : settled ? (hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "No matches")
    : "";

  return (
    <>
      <button
        type="button"
        className="search-trigger inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-input bg-card/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:w-52 lg:w-64"
        onClick={show}
        aria-label={`Search (${platform.label} K)`}
      >
        <SearchIcon className="size-3.5" />
        <span className="hidden md:inline">Search…</span>
        {/* The server paints ⌘K and a PC swaps in Ctrl K after mount; hidden on
            phones, so the swap only ever touches a desktop header. */}
        <span className="search-trigger-key ml-auto hidden sm:inline-flex" aria-hidden="true">
          <Kbd>{platform === MAC ? "⌘K" : "Ctrl K"}</Kbd>
        </span>
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
            <SearchIcon className="text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={hits.length ? `hit-${active}` : undefined}
              value={query}
              placeholder="Search posts and pages"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              aria-label="Search query"
            />
            <Kbd>esc</Kbd>
          </div>

          <p className="visually-hidden" role="status">{status}</p>

          <div className="search-body">
            {/* Only ever rendered after a failed load on the client, so reading
                `location` here cannot differ from the server's HTML. */}
            {state === "unavailable" && (
              <p className="search-note">
                Search is unavailable right now.
                {location.port === "3000" && (
                  <>
                    {" "}The index is only built by <code>npm run build</code>, so it
                    does not exist on the dev server.
                  </>
                )}
              </p>
            )}
            {state === "busy" && q && (
              <p className="search-note">Loading the index…</p>
            )}
            {settled && !hits.length && (
              <p className="search-note">No matches for “{q}”.</p>
            )}
            {!q && (
              <p className="search-note">
                Type to search posts, projects and docs. <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move, <Kbd>↵</Kbd> to open.
              </p>
            )}
            <div className="search-results" id="search-results" role="listbox" aria-label="Results">
              {hits.map((h, i) => (
                <a
                  key={h.url}
                  id={`hit-${i}`}
                  href={h.url}
                  role="option"
                  aria-selected={i === active}
                  aria-labelledby={`hit-${i}-title`}
                  className={`search-hit${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="search-hit-url">{h.url}</span>
                  <span className="search-hit-title" id={`hit-${i}-title`}>{h.title}</span>
                  <span
                    className="search-hit-excerpt"
                    dangerouslySetInnerHTML={{ __html: h.excerpt }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
