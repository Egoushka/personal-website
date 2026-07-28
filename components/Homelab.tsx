import Link from "next/link";
import { homelab } from "@/lib/site";
import HomelabDiagram from "@/components/HomelabDiagram";

export default function Homelab() {
  return (
    <section id="homelab" aria-labelledby="homelab-heading">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> homelab / uses</div>
        <h2 id="homelab-heading">What runs my lab</h2>
        <p className="section-intro">
          A single Hetzner VPS in Helsinki, run like a tiny production environment.
          This very site is served from it.
        </p>
        <HomelabDiagram />
        <div className="stack-grid">
          {homelab.map((item) => (
            <div className="stack-item" key={item.name}>
              <div className="name"><span className="accent">▸</span> {item.name}</div>
              <div className="desc">{item.desc}</div>
            </div>
          ))}
        </div>
        <p className="section-outro">
          <Link href="/posts/homelab/">Read how it&apos;s wired together →</Link>
        </p>
      </div>
    </section>
  );
}
