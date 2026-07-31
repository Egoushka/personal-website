import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import ProjectFilter from "@/components/ProjectFilter";
import { site, feedTypes, projects } from "@/lib/site";
import { topicName } from "@/lib/topics";

const description =
  "Side projects worth describing: an event store over seven years of chat history, and an app that refuses to give you a score.";

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

export default function Projects() {
  // Only topics some project actually carries. A chip that filters to nothing is
  // a broken control, and the vocabulary is much wider than these two projects.
  const used = [...new Set(projects.flatMap((p) => p.topics as string[]))];
  const topics = used.map((slug) => ({ slug, name: topicName(slug) }));

  return (
    <main id="main" className="wrap">
      <Nav current="projects" />

      <PageHead
        title="Projects"
        figures={
          <>
            {projects.length} projects
            <span className="sep">·</span>
            both running daily
            <span className="sep">·</span>
            0 with a user other than me
            <span className="sep">·</span>
            <a href={site.github} rel="noopener">github ↗</a>
          </>
        }
        lede="Each one exists because the alternative was worse, and each is best described by what it refuses to do."
      />

      <ProjectFilter projects={projects} topics={topics} />

      <Footer />
    </main>
  );
}
