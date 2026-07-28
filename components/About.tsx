import { skills } from "@/lib/site";

export default function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-heading">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> about</div>
        <h2 id="about-heading">What I do</h2>
        <p>
          I&apos;m a backend-leaning full-stack developer based in Ukraine. Day to
          day I work in <strong>C# / .NET and ASP.NET Core</strong>, with Angular
          and TypeScript on the front end. I care about the parts that don&apos;t
          show up in a demo: error handling, observability, predictable behaviour
          under load, and code the next person can read without a meeting.
        </p>
        <p>
          Outside of work I run a small homelab on a single VPS — a deliberate way
          to learn infrastructure properly: networking, secrets management,
          reverse proxies, and the difference between &quot;it works&quot; and
          &quot;it works at 3am.&quot;
        </p>
        <div className="chips">
          {skills.map((s) => (
            <span className="chip" key={s}>{s}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
