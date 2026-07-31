import type { Metadata } from "next";
import React from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EntryHead from "@/components/EntryHead";
import HomelabDiagram from "@/components/HomelabDiagram";
import { site, feedTypes, projects } from "@/lib/site";

const description =
  "Side projects and the homelab — a best-execution engine for order books, a network monitor, and one Hetzner box run like production.";

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Projects — ${site.name}`,
    description,
    url: `${site.url}/projects/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Projects — ${site.name}`, description },
};

/**
 * Each project is a row: the stack line and the repo link in the rail, the name
 * and one paragraph in the prose column.
 *
 * The design allows a `.bleed-code` block per project showing the interesting
 * bit of its API or output — deliberately not added here, because neither repo
 * has a snippet worth the space and inventing one would be a claim about code
 * that does not exist. The asymmetry is fine; add a block when there is real
 * output to show.
 */
export default function Projects() {
  return (
    <main id="main" className="wrap">
      <Nav current="projects" />

      <EntryHead
        title="Projects"
        claim={{ href: "/#claim-finished", label: "Claim 08 — has finished things" }}
        figures={
          <>
            {projects.length} projects · both running daily · 0 with a user other
            than the author · <a href={site.github} rel="noopener">github ↗</a>
          </>
        }
        lede="Each one exists because the alternative was worse, and each is described by what it refuses to do as much as by what it does."
      />

      {/*
        Measurements first, description second — the order the balance uses. What
        a project is measured at is checkable; what it is for is the author's own
        account of it, and the checkable thing goes on top.
      */}
      {projects.map((p) => (
        <React.Fragment key={p.name}>
          <hr className="bleed" />
          <section className="row">
            <span className="rail rail--label">{p.tags.join(" · ")}</span>
            <div>
              <h2 className="project-name">
                {p.href ? <a href={p.href} rel="noopener">{p.name}</a> : p.name}
              </h2>
              <p className="entry-figures">
                {p.meta}
                {p.href && (
                  <>
                    {" · "}
                    <a href={p.href} rel="noopener">source ↗</a>
                  </>
                )}
              </p>
              <p>{p.description}</p>
            </div>
          </section>
        </React.Fragment>
      ))}

      <hr className="bleed" />
      <section className="row">
        <span className="rail rail--label">Fig. 01</span>
        <div>
          <h2 className="project-name">Homelab</h2>
          <p className="entry-figures">
            1 VPS · Helsinki · every service defined in git
          </p>
          <p>
            A single VPS run like a tiny production environment — Tailscale in,
            Caddy at the edge, every service defined in a SOPS-encrypted GitOps
            repo. This site is served from it.
          </p>
        </div>
      </section>
      <figure className="bleed-code">
        <HomelabDiagram />
      </figure>

      <Footer />
    </main>
  );
}
