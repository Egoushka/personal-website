"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { skills, practice, uses } from "@/lib/site";
import { useStatus } from "@/lib/status";

/**
 * The skills as a readout.
 *
 * Not a diagram. Four lists, a mark per row, and a bar only where something
 * was genuinely measured. An unmeasured row simply says nothing: it is not a
 * zero, it is certainly not seven out of ten, and the em-dash that used to
 * stand in for it was a column of punctuation that needed explaining. There
 * are no proficiency ratings anywhere on this page and there never will be,
 * because nobody can check them; the whole argument of this site is that a
 * number should be checkable.
 *
 * Group names sit in the page's own rail rather than in a card header, so every
 * row starts on the same line as the title above it. The four bordered panels
 * this replaced were the reason the page read as small: a card inside a card
 * sets its own margin, and what was left for the sentence that matters was
 * eleven pixels of monospace.
 *
 * The filter is the reason it is a client component, and it is now the only
 * thing above the list. Twenty-odd rows is a scroll, and a reader who came
 * here for "does he know Postgres" should be one keystroke from the answer. It
 * says how much it hid, so nothing disappears silently.
 *
 * `practice` is deliberately NOT one of the groups. Observability and testing
 * were once a fifth column of rows beside Redis and Angular, as though they
 * were the same kind of noun — they are not, nobody installs a habit, and they
 * read as notes underneath instead.
 */
export default function SkillsBoard({ linkable }: { linkable: string[] }) {
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
            // MEASURABLE rows first, not measured ones. Sorting by the
            // percentage put this page's CLS at 0.017: the shares arrive from
            // /status.json after hydration, so every row below a measured one
            // moved down the page while the reader was looking at it. Whether
            // a skill HAS a wakatime key is build-time data, so the server and
            // the client agree and the bars fill in place. Sort is stable, so
            // ties keep the order lib/site.ts authored.
            .sort((a, b) => Number(!!b.wakatime) - Number(!!a.wakatime)),
        }))
        .filter((g) => g.items.length > 0),
    [query],
  );

  const total = skills.reduce((n, g) => n + g.items.length, 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="board">
      {/* In the prose column, on the title's line. `.row` puts it there and
          collapses with everything else at 900px. */}
      <div className="row">
        <div className="board-filter">
          <label>
            <span className="visually-hidden">Filter the skills</span>
            <input
              type="text"
              value={q}
              placeholder="filter"
              onChange={(e) => setQ(e.target.value)}
              spellCheck={false}
            />
          </label>
          {/* Always in the DOM so the count is announced when it changes. */}
          <span className="board-count" aria-live="polite">
            {query ? `${shown} of ${total}` : ""}
          </span>
        </div>
      </div>

      {groups.map((group) => (
        <section className="row board-group" key={group.group}>
          <div className="rail">
            <h2 className="rail--label">{group.group}</h2>
          </div>
          <ul className="board-list">
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
                  {/* An unmeasured row draws no track at all. A dashed rail on
                      fifteen of nineteen rows read as the main event on a page
                      whose main event is the sentence underneath it. */}
                  <span className="board-meter" aria-hidden="true">
                    {row && <span className="board-fill" style={{ width: `${Math.min(row.percent, 100)}%` }} />}
                  </span>
                  {row && <span className="board-num">{row.percent}%</span>}
                  <span className="board-now">{skill.now}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="board-empty">Nothing matches “{q}”. That is also an answer.</p>
      )}

      <section className="row board-group">
        <div className="rail">
          <h2 className="rail--label">How it gets used</h2>
        </div>
        <ul className="board-list board-list--notes">
          {practice.map((p) => (
            <li key={p.name}>
              <span className="board-name">{p.name}</span>
              <span className="board-now">{p.now}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What the hours above were measured on. Names only: the descriptions,
          the versions and the other ninety containers are not this page's job,
          and the box's address is already public. */}
      {uses.map((group) => (
        <section className="row board-group" key={group.group}>
          <div className="rail">
            <h2 className="rail--label">{group.group}</h2>
          </div>
          <ul className="board-box">
            {group.items.map((item) => (
              <li key={item.name}>
                {item.href
                  ? <a href={item.href} rel="noopener">{item.name}</a>
                  : <span>{item.name}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
