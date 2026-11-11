import { site } from "@/lib/site";
import { getAllPosts, getPost, byNewest } from "@/lib/posts";
import { POST_KINDS } from "@/lib/post-kinds.mjs";
import { ALL_TOPICS, topicName } from "@/lib/topics";

/**
 * What the WebMCP tools (public/webmcp.js) read, written at build time from the
 * same data the pages render. Two documents so a page that only registers the
 * tools fetches the small one: `/webmcp.json` is the index, `/webmcp-posts.json`
 * holds the Markdown and is fetched when `get_post` runs.
 */
export const STATUS_MAX_AGE_HOURS = 48;

export type WebMcpManifest = ReturnType<typeof buildManifest>;

export function buildManifest() {
  return {
    site: { name: site.name, role: site.role, url: site.url },
    contact: { email: site.email, page: `${site.url}/about/#contact` },
    // The tool says "unavailable" past this age, as the pages do. Equal to MAX_AGE_HOURS in
    // lib/status.ts (a client file, so not imported here); tests/webmcp.test.ts holds them together.
    statusMaxAgeHours: STATUS_MAX_AGE_HOURS,
    kinds: [...POST_KINDS],
    topics: ALL_TOPICS.map((slug) => ({ slug, name: topicName(slug) })),
    posts: getAllPosts()
      .sort(byNewest)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        description: p.description,
        kind: p.kind ?? null,
        topics: p.topics,
        url: `${site.url}/writing/${p.slug}/`,
      })),
  };
}

export function buildPosts() {
  return Object.fromEntries(getAllPosts().map((p) => [p.slug, getPost(p.slug).content]));
}
