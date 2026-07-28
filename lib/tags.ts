/**
 * Controlled tag vocabulary.
 *
 * Free-form tags are how tag pages rot: one post says "ci-cd", the next says
 * "cicd", and you end up with two hubs of one post each. `npm run validate`
 * fails on any tag not listed here, so adding a tag is a deliberate act.
 *
 * `label` is what renders; the key is what goes in frontmatter and in the URL.
 */
export const TAGS = {
  infrastructure: {
    label: "Infrastructure",
    description: "Servers, networking, and the parts that only matter at 3am.",
  },
  "self-hosting": {
    label: "Self-hosting",
    description: "Running things myself, on one box, on purpose.",
  },
  debugging: {
    label: "Debugging",
    description: "Bugs worth writing down, and how they were actually found.",
  },
  "ci-cd": {
    label: "CI/CD",
    description: "Pipelines, deploys, and the ways they fail quietly.",
  },
  dotnet: {
    label: ".NET",
    description: "C#, ASP.NET Core, EF Core — the day job.",
  },
} as const;

export type Tag = keyof typeof TAGS;

export const ALL_TAGS = Object.keys(TAGS) as Tag[];

export function isTag(value: string): value is Tag {
  return Object.prototype.hasOwnProperty.call(TAGS, value);
}

export function tagLabel(tag: string): string {
  return isTag(tag) ? TAGS[tag].label : tag;
}
