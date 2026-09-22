import { site, experience, projects, skills } from "@/lib/site";
import { topicName } from "@/lib/topics";
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

/**
 * `knowsAbout`, from the one curated list.
 *
 * It used to derive itself from the topic vocabulary — a near-verbatim copy of
 * the CV's old helper, kept in sync by hand in two files. Both are gone: this
 * reads `skills` in lib/site.ts, so the structured data says exactly what the
 * CV says and cannot drift from it.
 */
function knowsAbout(): string[] {
  return skills.flatMap((group) => group.items.map((skill) => skill.name));
}

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
            knowsAbout: knowsAbout(),
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
  const url = `${site.url}/writing/${post.slug}/`;
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
            keywords: post.topics.map(topicName),
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
              { "@type": "ListItem", position: 2, name: "Writing", item: `${site.url}/writing/` },
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
        url: `${site.url}/cv/`,
        name: `CV — ${site.name}`,
        mainEntity: { "@id": personId },
      }}
    />
  );
}
