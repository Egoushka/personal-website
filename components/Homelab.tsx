import Link from "next/link";
import { homelab } from "@/lib/site";

export default function Homelab() {
  return (
    <section id="homelab">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> homelab / uses</div>
        <h2>What runs my lab</h2>
        <p style={{ color: "var(--muted)", maxWidth: "62ch", marginBottom: 20 }}>
          A single Hetzner VPS in Helsinki, run like a tiny production environment.
          This very site is served from it.
        </p>
        <div className="stack-grid">
          {homelab.map((item) => (
            <div className="stack-item" key={item.name}>
              <div className="name"><span className="accent">▸</span> {item.name}</div>
              <div className="desc">{item.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link href="/posts/homelab/">Read how it&apos;s wired together →</Link>
        </p>
      </div>
    </section>
  );
}
