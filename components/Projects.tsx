import { projects } from "@/lib/site";

export default function Projects() {
  return (
    <section id="projects">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> projects</div>
        <h2>Selected work</h2>
        <div className="cards">
          {projects.map((p) => (
            <a className="card" href={p.href} target="_blank" rel="noopener" key={p.name}>
              <div className="top">
                <h3>{p.name}</h3>
                <span className="meta">{p.meta}</span>
              </div>
              <p>{p.description}</p>
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
