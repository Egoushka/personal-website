import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { site, projects } from "@/lib/site";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// One string for every project: a segment card's alt cannot read its params.
export const alt = `Projects — ${site.name}`;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16 made params a Promise in metadata routes too.
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug)!;
  return ogCard({ eyebrow: "Projects", title: project.name });
}
