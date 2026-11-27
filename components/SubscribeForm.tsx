"use client";

import { useState } from "react";
import { NEWSLETTER_FORM_ACTION, NEWSLETTER_LIST_UUID } from "@/lib/newsletter";

type State = "idle" | "sending" | "done" | "error";

/**
 * One field, double opt-in. Posts to listmonk's public form with fetch so the
 * confirmation shows in place. Without JS the form posts natively and listmonk
 * shows its own page. `from` is the page that showed it, sent with the Umami
 * `subscribe` event (an attempt: the address is only on the list once confirmed).
 */
export default function SubscribeForm({ from }: { from: string }) {
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(NEWSLETTER_FORM_ACTION, { method: "POST", body: new FormData(e.currentTarget) });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="mt-14" aria-labelledby="subscribe-heading" data-pagefind-ignore>
      <h2 id="subscribe-heading" className="text-sm font-medium text-muted-foreground">
        Get new posts by email
      </h2>
      {state === "done" ? (
        <p role="status" className="mt-3 rounded-xl border p-5">
          Check your inbox. I sent a link to confirm the address; until you click it, you get nothing else.
        </p>
      ) : (
        <form action={NEWSLETTER_FORM_ACTION} method="post" onSubmit={submit} className="mt-3 rounded-xl border p-5">
          <input type="hidden" name="l" value={NEWSLETTER_LIST_UUID} />
          {/* listmonk's honeypot: real visitors leave it empty. */}
          <input type="text" name="nonce" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <p className="text-sm text-muted-foreground">
            I write about .NET backends, agents and running my own server: what I built, what broke, with the code. One
            mail when a post ships, nothing else. I confirm your address first, every mail has an unsubscribe link, and
            the address is never sold. <a className="link" href="/privacy/">How it is handled</a>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="subscribe-email" className="sr-only">Email</label>
            <input
              id="subscribe-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground sm:max-w-xs"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              data-umami-event="subscribe"
              data-umami-event-from={from}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-brand-foreground shadow-xs hover:bg-brand/90 disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Subscribe"}
            </button>
          </div>
          {state === "error" && (
            <p role="alert" className="mt-3 text-sm text-caution">
              That did not go through. Check the address and try again.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
