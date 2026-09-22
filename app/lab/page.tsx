import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

const IDEAS = [
  { slug: "constellation", name: "A sky", blurb: "Skills as stars, groups as constellations. Brightness is what my editor actually measured this month. The least literal of the three, and the one that treats a stack as something you navigate rather than audit." },
  { slug: "monitor", name: "An instrument", blurb: "No diagram at all. Monospace, fixed columns, a bar only where something was really measured, and a header of live figures off the box. It looks like the thing it describes." },
  { slug: "strata", name: "Time", blurb: "Not the stack — how it was acquired. One track per role and project on a real time axis, with the technologies each one used. Every pixel comes from the same fields the CV reads, and it shows the gaps." },
];

export default function Lab() {
  return (
    <main id="main" className="wrap">
      <div className="lab-index">
        <h1>Three directions for the stack page</h1>
        <p>Pick one and it becomes /stack/. The other two get deleted.</p>
        <ul>
          {IDEAS.map((i) => (
            <li key={i.slug}>
              <Link href={`/lab/${i.slug}/`}>{i.name}</Link>
              <p>{i.blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
