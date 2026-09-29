import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import ProjectFilter, { type ProjectRow } from "@/components/ProjectFilter";
import { site, projects } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";
import { topicName } from "@/lib/topics";
import { getAllPosts } from "@/lib/posts";

const description =
  "A .NET validation library other people install, an orchestrator that checks every claim a coding agent makes, a homelab defined entirely in git, and an event store over seven years of chat history.";

export const metadata: Metadata = pageMetadata({ title: "Projects", description, path: "/projects/" });

export default function Projects() {
  // Chips only for topics at least two projects carry: a chip that filters to
  // one project is a link to it wearing a button's clothes.
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  const topics = [...counts.keys()]
    .filter((slug) => counts.get(slug)! >= 2)
    .map((slug) => ({ slug, name: topicName(slug) }));

  const posts = getAllPosts();
  const rows: ProjectRow[] = projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    shape: p.shape,
    status: p.status,
    summary: p.summary,
    posts: posts.filter((post) => post.project === p.slug).length,
    topics: p.topics.map((t) => ({ slug: t, name: topicName(t) })),
  }));

  // Counted rather than written out, so the figure cannot outlive the fact.
  const running = projects.filter((p) => p.status === "running").length;

  return (
    <Shell current="projects">

      <PageHead
        title="Projects"
        quiet
        figures={
          <>
            <span>{projects.length} projects</span>{" "}
            <span>{running} still running</span>{" "}
            <span><a href={site.github} rel="noopener">GitHub</a></span>
          </>
        }
      />

      <ProjectFilter projects={rows} topics={topics} />

    </Shell>
  );
}
