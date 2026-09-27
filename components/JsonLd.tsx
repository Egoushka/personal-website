import { site, experience, skills } from "@/lib/site";
import { topicName } from "@/lib/topics";
import type { PostMeta } from "@/lib/posts";

/**
 * Structured data. Rendered as a plain <script type="application/ld+json"> — no
 * client JS, it is inert markup that only crawlers read.
 *
 * dangerouslySetInnerHTML is the documented way to emit JSON-LD in React.
 * JSON.stringify does not escape `<`, so a `</script>` in any string would end
 * the element early; `\u003c` is the same character to a JSON parser.
 */
function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const personId = `${site.url}/#person`;
const siteId = `${site.url}/#website`;

/** `knowsAbout`, from the curated skills list, so the structured data says exactly what the CV says. */
function knowsAbout(): string[] {
  return skills.flatMap((group) => group.items.map((skill) => skill.name));
}

/** Enough of the Person to stand alone in any page's graph; the @id joins them up. */
function personNode() {
  return {
    "@type": "Person",
    "@id": personId,
    name: site.name,
    url: site.url,
    sameAs: [site.github, site.linkedin],
  };
}

/** The whole Person: the home page and the CV, the two pages that are about him. */
function fullPerson() {
  const current = experience.find((j) => j.end === null);
  return {
    ...personNode(),
    email: `mailto:${site.email}`,
    jobTitle: site.role,
    description: site.description,
    knowsAbout: knowsAbout(),
    ...(current && { worksFor: { "@type": "Organization", name: current.company } }),
  };
}

/** Homepage: who this is, and what site it is. */
export function PersonAndSiteLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@graph": [
          fullPerson(),
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
            dateModified: post.updated ?? post.date,
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
          personNode(),
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
        "@graph": [
          {
            "@type": "ProfilePage",
            "@id": `${site.url}/cv/`,
            url: `${site.url}/cv/`,
            name: `CV — ${site.name}`,
            mainEntity: { "@id": personId },
          },
          fullPerson(),
        ],
      }}
    />
  );
}
