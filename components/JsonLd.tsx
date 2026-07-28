import { site, skills, experience } from "@/lib/site";
import type { PostMeta } from "@/lib/posts";

/**
 * Structured data. Rendered as a plain <script type="application/ld+json"> — no
 * client JS, it is inert markup that only crawlers read.
 *
 * dangerouslySetInnerHTML is the documented way to emit JSON-LD in React; the
 * payload is built from typed local data, never from user input, so there is no
 * injection surface. JSON.stringify escapes the content.
 */
function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const personId = `${site.url}/#person`;
const siteId = `${site.url}/#website`;

/** Homepage: who this is, and what site it is. Both get stable @ids so the
 *  per-page graphs below can reference them instead of repeating themselves. */
export function PersonAndSiteLd() {
  const current = experience.find((j) => j.when.includes("present"));
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": personId,
            name: site.name,
            url: site.url,
            email: `mailto:${site.email}`,
            jobTitle: site.role,
            description: site.description,
            knowsAbout: skills,
            sameAs: [site.github, site.linkedin],
            ...(current && { worksFor: { "@type": "Organization", name: current.company } }),
          },
          {
            "@type": "WebSite",
            "@id": siteId,
            url: site.url,
            name: site.name,
            description: site.description,
            inLanguage: "en",
            publisher: { "@id": personId },
          },
        ],
      }}
    />
  );
}

export function BlogPostingLd({ post }: { post: PostMeta }) {
  const url = `${site.url}/posts/${post.slug}/`;
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            "@id": url,
            headline: post.title,
            description: post.description,
            url,
            datePublished: post.date,
            dateModified: post.date,
            keywords: post.tags,
            wordCount: post.wordCount,
            timeRequired: `PT${post.readingTime}M`,
            inLanguage: "en",
            image: `${url}opengraph-image`,
            author: { "@id": personId },
            publisher: { "@id": personId },
            isPartOf: { "@id": siteId },
            mainEntityOfPage: url,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog/` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          },
        ],
      }}
    />
  );
}

export function ProfilePageLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: `${site.url}/resume/`,
        name: `Résumé — ${site.name}`,
        mainEntity: { "@id": personId },
      }}
    />
  );
}
