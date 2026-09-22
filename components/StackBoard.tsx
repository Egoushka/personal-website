"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { skills, practice, uses } from "@/lib/site";
import { useStatus } from "@/lib/status";

/**
 * The stack as an instrument.
 *
 * Not a diagram. A readout: fixed columns, a mark per row, and a bar only
 * where something was genuinely measured. Everything else gets a dash —
 * an unmeasured skill is not a zero, and it is certainly not seven out of ten.
 * There are no proficiency ratings anywhere on this page and there never will
 * be, because nobody can check them; the whole argument of this site is that a
 * number should be checkable.
 *
 * The filter is the reason it is a client component. Twenty-odd rows is a
 * scroll, and a reader who came here for "does he know Postgres" should be one
 * keystroke from the answer. It narrows the list live and says how much it
 * hid, so nothing disappears silently.
 *
 * `practice` is deliberately NOT in the grid. Observability and testing were
 * once a fifth column of rows beside Redis and Angular, as though they were
 * the same kind of noun — they are not, nobody installs a habit, and they read
 * as sentences underneath instead.
 */
export default function StackBoard({ linkable }: { linkable: string[] }) {
  const status = useStatus();
  const [q, setQ] = useState("");
  const hasPage = useMemo(() => new Set(linkable), [linkable]);
  const langs = status?.coding?.languages ?? [];
  const measured = (key?: string) => (key ? langs.find((l) => l.name === key) : undefined);

  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      skills
        .map((g) => ({
          group: g.group,
          items: g.items
            .filter(
              (s) =>
                !query ||
                s.name.toLowerCase().includes(query) ||
                s.now.toLowerCase().includes(query),
            )
            // Measured rows first: if the box has an opinion about this month,
            // that is the most interesting thing on the page.
            .sort((a, b) => (measured(b.wakatime)?.percent ?? -1) - (measured(a.wakatime)?.percent ?? -1)),
        }))
        .filter((g) => g.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, langs],
  );

  const total = skills.reduce((n, g) => n + g.items.length, 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="board">
      <header className="board-bar">
        <span className="board-prompt">~/stack</span>
        {status ? (
          <>
            <span>{status.containers} containers</span>
            <span>up {status.uptimeDays}d</span>
            {status.coding && <span>{status.coding.hours}h / 30d</span>}
            {status.coding?.editor && (
              <span>
                {status.coding.editor.toLowerCase()} {status.coding.editorPercent}%
              </span>
            )}
            <span className={status.unhealthy ? "board-bad" : "board-ok"}>
              {status.unhealthy ? `${status.unhealthy} unhealthy` : "all healthy"}
            </span>
          </>
        ) : (
          <span className="board-dim">box not reporting</span>
        )}
        <label className="board-filter">
          <span className="visually-hidden">Filter the stack</span>
          <input
            type="text"
            value={q}
            placeholder="filter"
            onChange={(e) => setQ(e.target.value)}
            spellCheck={false}
          />
        </label>
        <span className="board-count">
          {shown === total ? `${total}` : `${shown}/${total}`}
        </span>
      </header>

      <div className="board-grid">
        {groups.map((group) => (
          <section className="board-panel" key={group.group}>
            <h2>
              <span>{group.group}</span>
              <span className="board-panel-n">{group.items.length}</span>
            </h2>
            <ul>
              {group.items.map((skill) => {
                const row = measured(skill.wakatime);
                return (
                  <li key={skill.name} className={row ? "is-measured" : undefined}>
                    <span className="board-mark"><Icon name={skill.icon} /></span>
                    <span className="board-name">
                      {skill.topic && hasPage.has(skill.topic) ? (
                        <Link href={`/topics/${skill.topic}/`}>{skill.name}</Link>
                      ) : (
                        skill.name
                      )}
                    </span>
                    <span className="board-meter" aria-hidden="true">
                      {row ? (
                        <span className="board-fill" style={{ width: `${Math.min(row.percent, 100)}%` }} />
                      ) : (
                        <span className="board-none" />
                      )}
                    </span>
                    <span className="board-num">{row ? `${row.percent}%` : "—"}</span>
                    <span className="board-now">{skill.now}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="board-empty">Nothing matches “{q}”. That is also an answer.</p>
      )}

      <section className="board-practice">
        <h2 className="rail--label">And how it gets used</h2>
        <p>
          {practice.map((p, i) => (
            <span key={p.name}>
              {i > 0 && " "}
              <strong>{p.name}</strong> — {p.now}
            </span>
          ))}
        </p>
      </section>

      <section className="board-box">
        <h2 className="rail--label">What runs on the box</h2>
        <ul>
          {uses.flatMap((g) => g.items).map((item) => (
            <li key={item.name}>
              {item.href ? <a href={item.href} rel="noopener">{item.name}</a> : item.name}
            </li>
          ))}
        </ul>
      </section>

      <p className="board-foot">
        Bars are the share of measured editor time over the last thirty days,
        from a Wakapi I host on the same box. A dash means it was not measured —
        not that it is worth less. Nothing here is a rating.
      </p>
    </div>
  );
}
