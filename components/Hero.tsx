import { site } from "@/lib/site";

export default function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="prompt"><span className="dollar">$</span> whoami</div>
        <h1>{site.name}</h1>
        <p className="tagline">{site.role}<span className="cursor" /></p>
        <p className="lead">
          I build and run reliable systems — backend services in .NET, the
          occasional Angular front end, and a self-hosted infrastructure stack I
          treat as a lab. Currently working on fintech trading systems at
          Boerse Stuttgart Digital. {site.tagline}
        </p>
        <div className="cta-row">
          <a className="btn primary" href="#projects">View projects</a>
          <a className="btn" href="/cv.pdf">Download CV</a>
          <a className="btn" href={site.github} target="_blank" rel="noopener">GitHub ↗</a>
        </div>
      </div>
    </header>
  );
}
