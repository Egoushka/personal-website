import { projects } from "./site";
import { byNewest, getAllPosts, getRelatedPosts, type PostMeta } from "./posts";

export type NextStep = {
  /** The post to read next: frontmatter `related`, else the closest post, else the newest. */
  read?: PostMeta;
  /** The "try it" link: frontmatter `try`, else the project's public repo, else its page here. */
  tryIt?: { label: string; href: string; external: boolean };
};

/** Pure, so tests can hand it posts; the callers pass the whole list. */
export function pickNext(post: PostMeta, all: PostMeta[], related: PostMeta | undefined): NextStep {
  const others = all.filter((p) => p.slug !== post.slug);
  const read = others.find((p) => p.slug === post.related) ?? related ?? [...others].sort(byNewest)[0];

  const project = projects.find((p) => p.slug === post.project);
  let tryIt: NextStep["tryIt"];
  if (post.try) {
    tryIt = { label: "Try it", href: post.try, external: post.try.startsWith("https://") };
  } else if (project) {
    const repo = project.visibility === "public" && project.href ? project.href : undefined;
    tryIt = repo
      ? { label: `Try ${project.name}`, href: repo, external: true }
      : { label: `About ${project.name}`, href: `/projects/${project.slug}/`, external: false };
  }
  return { read, tryIt };
}

export function nextStep(post: PostMeta): NextStep {
  return pickNext(post, getAllPosts(), getRelatedPosts(post.slug, 1)[0]);
}
