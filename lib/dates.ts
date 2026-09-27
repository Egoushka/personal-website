/**
 * Month-precision dates on the record: `"YYYY-MM"`.
 *
 * The one place a job's dates are parsed. `end` is the last month worked,
 * inclusive; `null` means the role is current. Anything that is not a real
 * month throws, so a typo in lib/site.ts fails the build instead of drawing.
 */
export type Span = { start: string; end: string | null };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(month: string): { year: number; month: number } {
  const hit = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!hit) throw new Error(`Not a "YYYY-MM" month: ${JSON.stringify(month)}`);
  return { year: Number(hit[1]), month: Number(hit[2]) };
}

/**
 * `"Aug 2025 — present"`, or in the numeric form `"2025-08 — present"`.
 *
 * The numeric form is the CV's. Set in tabular figures every date is the same
 * width, so the printed sheet's right-hand column is a straight edge.
 */
export function formatSpan({ start, end }: Span, form: "text" | "numeric" = "text"): string {
  const one = (m: string) => {
    const { year, month } = parse(m);
    return form === "numeric" ? m : `${MONTHS[month - 1]} ${year}`;
  };
  return `${one(start)} — ${end === null ? "present" : one(end)}`;
}

/** `"2025-08"` → `2025.583`: the year, plus the months before this one. */
export function yearFraction(month: string): number {
  const p = parse(month);
  return p.year + (p.month - 1) / 12;
}

/** `"2025-08"` → `2025.667`: the end of that month, for an inclusive `end`. */
export function yearFractionEnd(month: string): number {
  return yearFraction(month) + 1 / 12;
}
