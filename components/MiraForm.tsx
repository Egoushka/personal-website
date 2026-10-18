"use client";

import { useState } from "react";
import { MIRA_DOWNLOADS, MIRA_FORM_ACTION, MIRA_LIST_UUID } from "@/lib/mira";

type State = "idle" | "sending" | "done" | "error";

const field =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground";

/**
 * Posts to listmonk's public form with fetch so the download links can replace
 * the form. Without JS the form posts natively and listmonk shows its own
 * confirmation page; the links are on the success state only.
 */
export default function MiraForm() {
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(MIRA_FORM_ACTION, { method: "POST", body: new FormData(e.currentTarget) });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-lg border p-5">
        <p className="font-medium">Done. Here is the free flow:</p>
        <ul className="mt-3 space-y-2">
          {MIRA_DOWNLOADS.map((d) => (
            <li key={d.href}>
              <a className="link" href={d.href} download>{d.label}</a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          You are on the list for occasional emails from Mira. Every email has an unsubscribe link.
        </p>
      </div>
    );
  }

  return (
    <form action={MIRA_FORM_ACTION} method="post" onSubmit={submit} className="space-y-4">
      <input type="hidden" name="l" value={MIRA_LIST_UUID} />
      {/* listmonk's honeypot: real visitors leave it empty. */}
      <input type="text" name="nonce" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div>
        <label htmlFor="mira-email" className="mb-1.5 block text-sm font-medium">Email</label>
        <input id="mira-email" className={field} type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="flex items-start gap-3">
        <input id="mira-consent" type="checkbox" required className="mt-1 size-5 shrink-0" />
        <label htmlFor="mira-consent" className="text-sm leading-relaxed">
          I agree to get this download and occasional emails from Mira at this address. I can
          unsubscribe at any time.
        </label>
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-brand-foreground shadow-xs hover:bg-brand/90 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Get the free flow"}
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm text-caution">
          That did not go through. Check the address and try again.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Privacy: I use your email only to send the download and Mira's emails. It is stored on my own
        server, not sold or shared, and deleted when you unsubscribe or ask me to.
      </p>
    </form>
  );
}
