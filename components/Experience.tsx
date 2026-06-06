import Link from "next/link";
import { experience } from "@/lib/site";

export default function Experience() {
  return (
    <section id="experience">
      <div className="wrap">
        <div className="section-label"><span className="hash">#</span> experience</div>
        <h2>Where I&apos;ve worked</h2>
        <div className="timeline">
          {experience.map((job) => (
            <div className="job" key={job.company}>
              <div className="when">{job.when}</div>
              <h3>{job.company}</h3>
              <div className="role">{job.role}</div>
              <ul>
                {job.points.map((pt, i) => (
                  <li key={i}>
                    {pt.text}
                    {pt.link && <Link href={pt.link.href}>{pt.link.label}</Link>}
                    {pt.after}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
