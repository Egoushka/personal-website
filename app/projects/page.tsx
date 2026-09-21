import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHead from "@/components/PageHead";
import ProjectFilter from "@/components/ProjectFilter";
import { site, feedTypes, projects } from "@/lib/site";
import { topicName } from "@/lib/topics";

const description =
  "A .NET validation library other people install, a homelab defined entirely in git, an event store over seven years of chat history, and a trading system whose result so far is two rejected hypotheses.";

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

  // Counted rather than written out. "0 with a user other than me" was true of
  // this page for exactly as long as nothing here was published, and it went on
  // being printed after that stopped being true.
  const running = projects.filter((p) => p.status === "running").length;
  const shipped = projects.filter((p) => !p.side).length;

  return (
    <main id="main" className="wrap">
      <Nav current="projects" />

      <PageHead
        title="Projects"
        figures={
          <>
            <span>{projects.length} projects</span>
            <span>{running} still running</span>
            <span><a href={site.github} rel="noopener">GitHub</a></span>
          </>
        }
        lede="Each one exists because the alternative was worse, and most of them are best described by what they refuse to do. Only the first is something you can install; the rest run for one user, and the repositories are private."
      />

      <ProjectFilter projects={projects} topics={topics} />

      <Footer />
    </main>
  );
}
