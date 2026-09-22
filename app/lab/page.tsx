import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

const IDEAS = [
  { slug: "monitor", name: "An instrument", blurb: "Shipped: this is /stack/ now. Kept here so the others can be compared against it." },
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
