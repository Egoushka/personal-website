import { Feed } from "feed";
import { site } from "./site";
import { getAllPosts } from "./posts";

/** Shared feed object — serialised as RSS 2.0, Atom or JSON Feed by the route handlers. */
export function buildFeed(): Feed {
  const posts = getAllPosts();
  const feed = new Feed({
    title: `${site.name} — ${site.role}`,
    description: site.description,
    id: `${site.url}/`,
    link: `${site.url}/`,
    language: "en",
    copyright: `© ${new Date().getFullYear()} ${site.name}`,
    updated: posts[0] ? new Date(posts[0].date) : undefined,
    feedLinks: {
      rss: `${site.url}/feed.xml`,
      atom: `${site.url}/atom.xml`,
      json: `${site.url}/feed.json`,
    },
    author: { name: site.name, email: site.email, link: site.url },
  });

  for (const post of posts) {
    const url = `${site.url}/posts/${post.slug}/`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      date: new Date(post.date),
      category: post.tags.map((name) => ({ name })),
      author: [{ name: site.name, link: site.url }],
    });
  }

  return feed;
}
