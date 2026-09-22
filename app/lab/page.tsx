import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

const IDEAS = [
  { slug: "monitor", name: "An instrument", blurb: "Shipped: this is /stack/ now. Kept here so the others can be compared against it." },
  { slug: "shell", name: "A shell", blurb: "Not a picture of a terminal — a small real one. `ls backend`, `cat redis`, `top`, `uptime`, `ps`. It answers from the same data as every other page and gets its live figures from the box. The only idea where the interface is the argument." },
  { slug: "strata", name: "Time", blurb: "Shipped as /journey/. Kept here as the rough version it grew out of." },
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
