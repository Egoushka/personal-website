"use client";

import { useEffect, useRef, useState } from "react";
import { skills, practice, projects, uses, site } from "@/lib/site";
import { useStatus } from "@/lib/status";

/**
 * IDEA FOUR — a shell you can actually type into.
 *
 * Not a picture of a terminal. A small real one: it parses what you type,
 * answers from the same data every other page reads, and gets the live figures
 * from the box. `help` lists what it knows.
 *
 * Why this and not another diagram: everything else on this site asks the
 * reader to look. This asks them to *do* something, and what they do is query
 * a backend developer's stack the way they would query anything else. It is
 * also the only version of the page where the interface is the argument — a
 * person who would build this is the person the copy claims he is.
 *
 * It is genuinely small. No shell library, no parser generator, no history
 * file: a switch over a first word, about eighty lines, and the whole thing
 * degrades to a readable transcript with JavaScript off because the opening
 * lines are server-rendered.
 */

type Line = { kind: "in" | "out" | "err"; text: string };

const BANNER: Line[] = [
  { kind: "out", text: `${site.name} — stack shell. Type "help".` },
];

export default function Shell() {
  const status = useStatus();
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  function run(raw: string): Line[] {
    const [cmd, ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    const all = skills.flatMap((g) => g.items);

    switch (cmd) {
      case "":
        return [];
      case "help":
        return [
          { kind: "out", text: "ls                 the groups" },
          { kind: "out", text: "ls <group>         what is in one" },
          { kind: "out", text: "cat <skill>        where it stands" },
          { kind: "out", text: "top                what my editor measured, last 30 days" },
          { kind: "out", text: "uptime             the box, right now" },
          { kind: "out", text: "ps                 what is running on it" },
          { kind: "out", text: "projects           what I have built" },
          { kind: "out", text: "practice           how the stack gets used" },
          { kind: "out", text: "whoami             short version" },
          { kind: "out", text: "clear              start again" },
        ];
      case "ls": {
        if (!arg) return skills.map((g) => ({ kind: "out" as const, text: `${g.group.padEnd(16)} ${g.items.length}` }));
        const group = skills.find((g) => g.group.toLowerCase().startsWith(arg));
        if (!group) return [{ kind: "err", text: `ls: no group "${arg}". try: ${skills.map((g) => g.group.toLowerCase()).join(", ")}` }];
        return group.items.map((s) => ({ kind: "out" as const, text: s.name }));
      }
      case "cat": {
        if (!arg) return [{ kind: "err", text: "cat: name a skill" }];
        const hit = all.find((s) => s.name.toLowerCase().includes(arg));
        if (!hit) return [{ kind: "err", text: `cat: ${arg}: no such skill` }];
        return [{ kind: "out", text: `${hit.name} — ${hit.now}` }];
      }
      case "top": {
        const langs = status?.coding?.languages;
        if (!langs?.length) return [{ kind: "err", text: "top: the box is not reporting" }];
        return langs.slice(0, 8).map((l) => ({
          kind: "out" as const,
          text: `${String(l.percent).padStart(3)}%  ${"█".repeat(Math.max(1, Math.round(l.percent / 4)))} ${l.name}`,
        }));
      }
      case "uptime": {
        if (!status) return [{ kind: "err", text: "uptime: the box is not reporting" }];
        return [{
          kind: "out",
          text: `up ${status.uptimeDays} days, ${status.containers} containers, ${status.unhealthy ? `${status.unhealthy} unhealthy` : "all healthy"}`,
        }];
      }
      case "ps":
        return uses.flatMap((g) => g.items).map((i) => ({ kind: "out" as const, text: i.name }));
      case "projects":
        return projects.map((p) => ({
          kind: "out" as const,
          text: `${p.name.padEnd(16)} ${p.lang.padEnd(10)} ${p.visibility === "private" ? "private" : "public"}`,
        }));
      case "practice":
        return practice.map((p) => ({ kind: "out" as const, text: `${p.name} — ${p.now}` }));
      case "whoami":
        return [{ kind: "out", text: site.intro }, { kind: "out", text: `${site.location} — ${site.availability}` }];
      case "clear":
        return [];
      default:
        return [{ kind: "err", text: `${cmd}: command not found. try "help".` }];
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value;
    setValue("");
    if (raw.trim() === "clear") { setLines(BANNER); return; }
    setLines((prev) => [...prev, { kind: "in", text: raw }, ...run(raw)]);
  }

  return (
    <div className="sh" onClick={() => inputRef.current?.focus()}>
      <div className="sh-out" role="log" aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={`sh-line sh-line--${l.kind}`}>
            {l.kind === "in" && <span className="sh-ps">$</span>}
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <form className="sh-form" onSubmit={submit}>
        <span className="sh-ps" aria-hidden="true">$</span>
        <label className="visually-hidden" htmlFor="sh-in">Type a command</label>
        <input
          id="sh-in"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="help"
        />
        {/* A real submit control, not just implicit submission: a form whose
            only way in is the Enter key is one that some browsers and most
            assistive tech will not submit at all. */}
        <button type="submit" className="sh-go">run</button>
      </form>
    </div>
  );
}
