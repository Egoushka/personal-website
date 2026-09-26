import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getAllSlugs, getPost } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// One string for every post: a segment card's alt cannot read its params.
export const alt = `Writing — ${site.name}`;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16 made params a Promise in metadata routes too.
  const { slug } = await params;
  const post = getPost(slug);
  return ogCard({ eyebrow: "Writing", title: post.title });
}
