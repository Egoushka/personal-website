import { site } from "@/lib/site";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> contact</div>
        <h2 id="contact-heading">Get in touch</h2>
        <p className="section-intro">
          Open to interesting backend / full-stack work and good conversations.
          The fastest way to reach me:
        </p>
        <div className="cta-row">
          <a className="btn primary" href={`mailto:${site.email}`}>Email me</a>
          <a className="btn" href={site.github} target="_blank" rel="noopener">GitHub ↗</a>
          <a className="btn" href={site.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
        </div>
      </div>
    </section>
  );
}
