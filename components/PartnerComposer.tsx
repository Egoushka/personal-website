"use client";

import { useState } from "react";
import { Copy, Mail } from "@/components/ui/icons";

const SHAPES = ["Co-build", "Integrate", "Distribute", "Use it honestly"] as const;
const ABOUT = [
  "Agent-ready checker",
  "WebMCP for ASP.NET and Blazor",
  "chargehand hosted",
  "x402 .NET kit",
  "touchstone",
  "Attest",
  "oura-platform",
  "Something else",
];

/**
 * A mail draft, built in the page and handed to the visitor's own mail app.
 * Nothing is sent from here. Without JS the server-rendered link still opens a
 * blank mail to the same address.
 */
export default function PartnerComposer({ email }: { email: string }) {
  const [kind, setKind] = useState<(typeof SHAPES)[number]>("Co-build");
  const [about, setAbout] = useState(ABOUT[0]);
  const [have, setHave] = useState("");
  const [copied, setCopied] = useState(false);

  const subject = `${kind}: ${about}`;
  const body = `Hi Yehor,\n\nI would like to ${kind.toLowerCase()} ${about}.\nWhat I have: ${have || "…"}\nWhat I want from it: …`;
  const draft = `To: ${email}\nSubject: ${subject}\n\n${body}`;
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="cgrid">
      <div className="cform">
        <div>
          <span id="shape-l" className="mb-1 block text-xs font-medium text-muted-foreground">
            Shape
          </span>
          <div className="seg" role="group" aria-labelledby="shape-l">
            {SHAPES.map((s) => (
              <button key={s} type="button" aria-pressed={kind === s} onClick={() => setKind(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>About</span>
          <select value={about} onChange={(e) => setAbout(e.target.value)}>
            {ABOUT.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          <span>What you have</span>
          <input value={have} onChange={(e) => setHave(e.target.value)} placeholder="a team, an API, an audience…" autoComplete="off" />
        </label>
        <div className="acts !mt-0">
          <a className="key key-primary" href={href}>
            <Mail aria-hidden="true" /> Open in mail
          </a>
          <button type="button" className="key" onClick={copy}>
            <Copy aria-hidden="true" /> {copied ? "Copied" : "Copy text"}
          </button>
        </div>
      </div>
      <pre className="draft" aria-live="polite">
        {draft}
      </pre>
    </div>
  );
}
