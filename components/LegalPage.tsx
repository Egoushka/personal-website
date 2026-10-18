import React from "react";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import { formatDate } from "@/lib/posts";

/**
 * A plain policy page: title, effective date, numbered sections.
 *
 * Used for the documents an API client of mine must publish (YouTube API Services
 * Developer Policies require a public privacy policy and terms). Kept out of the
 * nav and the sitemap: people arrive from the consent screen or the audit form.
 */
export default function LegalPage({
  title,
  effective,
  sections,
}: {
  title: string;
  /** ISO date the current text took effect. */
  effective: string;
  sections: { heading: string; body: React.ReactNode }[];
}) {
  return (
    <Shell>
      <article className="max-w-2xl">
        <PageHead title={title} />
        <p className="text-sm text-muted-foreground">
          Effective <time dateTime={effective}>{formatDate(effective)}</time>
        </p>
        <div className="mt-8 space-y-8 text-lg leading-relaxed">
          {sections.map((s, i) => (
            <section key={s.heading} aria-labelledby={`legal-${i + 1}`}>
              <h2 id={`legal-${i + 1}`} className="text-xl font-semibold tracking-tight">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-3 space-y-3">{s.body}</div>
            </section>
          ))}
        </div>
      </article>
    </Shell>
  );
}
