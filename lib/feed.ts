import { Feed } from "feed";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { site } from "./site";
import { getAllPosts, getPost } from "./posts";
import { topicName } from "./topics";

type HastNode = { type: string; properties?: Record<string, unknown>; children?: HastNode[] };

/**
 * A feed reader has no base URL for a post, so `/writing/x/` and `#section`
 * would resolve against the reader's own origin. Both are made absolute.
 */
function absoluteLinks(postUrl: string) {
  return () => (tree: HastNode) => {
    const visit = (node: HastNode) => {
      for (const attr of ["href", "src"] as const) {
        const value = node.properties?.[attr];
        if (typeof value !== "string") continue;
        if (value.startsWith("/") && !value.startsWith("//")) node.properties![attr] = site.url + value;
        else if (value.startsWith("#")) node.properties![attr] = postUrl + value;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

/**
 * The post body as HTML for a feed reader: the page's own markdown pipeline
 * minus the highlighter, whose inline colours a reader would restyle anyway.
 */
function bodyHtml(markdown: string, postUrl: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(absoluteLinks(postUrl))
      .use(rehypeStringify)
      .processSync(markdown),
  );
}

/** Shared feed object — serialised as RSS 2.0, Atom or JSON Feed by the route handlers. */
export function buildFeed(): Feed {
  const posts = getAllPosts();
  const modified = posts.map((p) => p.updated ?? p.date).sort().at(-1);
  const author = { name: site.name, email: site.email, link: site.url };
  const feed = new Feed({
    title: `${site.name} — ${site.role}`,
    description: site.description,
    id: `${site.url}/`,
    link: `${site.url}/`,
    language: "en",
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
    updated: modified ? new Date(modified) : undefined,
    feedLinks: {
      rss: `${site.url}/feed.xml`,
      atom: `${site.url}/atom.xml`,
      json: `${site.url}/feed.json`,
    },
    author,
  });

  for (const post of posts) {
    const url = `${site.url}/writing/${post.slug}/`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      content: bodyHtml(getPost(post.slug).content, url),
      published: new Date(post.date),
      date: new Date(post.updated ?? post.date),
      category: post.topics.map((slug) => ({ name: topicName(slug) })),
      author: [author],
    });
  }

  return feed;
}
