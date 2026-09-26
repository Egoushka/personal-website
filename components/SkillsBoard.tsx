"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStatus } from "@/lib/status";

/** One row, reduced on the server to what the board renders. */
export type BoardSkill = {
  name: string;
  now: string;
  /** Wakapi's name for it, when it can be measured. */
  wakatime?: string;
  /** The topic hub, when one exists. */
  href?: string;
  /** Rendered on the server, so lib/icons.ts stays out of this bundle. */
  icon?: React.ReactNode;
};

export type BoardData = {
  skills: { group: string; items: BoardSkill[] }[];
  practice: { name: string; now: string }[];
  uses: { group: string; items: { name: string; href?: string }[] }[];
};

/**
 * The skills as a readout.
 *
 * Four lists, a mark per row, and a bar only where something was genuinely
 * measured. An unmeasured row says nothing: it is not a zero and it is not
 * seven out of ten. There are no proficiency ratings anywhere on this page,
 * because nobody can check them.
 *
 * Group names sit in the page's own rail, so every row starts on the same
 * line as the title above it.
 *
 * The filter is the reason it is a client component. A reader who came here
 * for "does he know Postgres" should be one keystroke from the answer, and it
 * says how much it hid, so nothing disappears silently.
 *
 * `practice` is deliberately NOT one of the groups: nobody installs a habit,
 * so those read as notes underneath instead.
 */
export default function SkillsBoard({
  data: { skills, practice, uses },
  searchMark,
}: {
  data: BoardData;
  searchMark: React.ReactNode;
}) {
  const status = useStatus();
  const [q, setQ] = useState("");
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
    [query, skills],
  );

  const total = skills.reduce((n, g) => n + g.items.length, 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="board">
      {/* The first thing on the page now that the title is gone, so it is a
          field rather than a box: the whole thing is the target, the glyph
          says what it does without a label taking a line, and the count lives
          inside it. `.row` puts it in the prose column and collapses it with
          everything else at 900px. */}
      <div className="row">
        <div className="board-filter">
          <span className="board-filter-mark" aria-hidden="true">
            {searchMark}
          </span>
          <label className="visually-hidden" htmlFor="skills-filter">
            Filter the skills
          </label>
          <input
            id="skills-filter"
            type="search"
            value={q}
            placeholder="Filter — postgres, docker, jobs"
            onChange={(e) => setQ(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          {/* Always in the DOM so a change is announced rather than an
              insertion. Empty until the list is actually narrowed. */}
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
                  <span className="board-mark">{skill.icon}</span>
                  <span className="board-name">
                    {skill.href ? (
                      <Link href={skill.href}>{skill.name}</Link>
                    ) : (
                      skill.name
                    )}
                  </span>
                  {/* An unmeasured row draws no track at all. A dashed rail on
                      fifteen of nineteen rows read as the main event on a page
                      whose main event is the sentence underneath it. */}
                  <span className="board-meter" aria-hidden="true">
                    {row && <span className="board-fill" style={{ "--w": `${Math.min(row.percent, 100)}%` } as React.CSSProperties} />}
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
