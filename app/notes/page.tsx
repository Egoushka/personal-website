import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";
import { ArrowLeft } from "@/components/ui/icons";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getNotes } from "@/lib/posts";
import { n } from "@/lib/readings";

const description =
  "One finding each, in a few hundred words: the number or the surprise, the evidence, and what it does not tell you — by Yehor Hrabovskyi.";

/**
 * The notes on their own. A note is a post (ADR 0009): its page is
 * /writing/<slug>/, and /writing/ and the feeds carry it with the rest, so this
 * is a second view of the same posts, not a section. It sits outside /writing/
 * so no post slug can ever collide with it.
 *
 * Like a topic hub, one note is its own search result, not a list worth one:
 * below two the page is `noindex`, and app/sitemap.ts leaves it out by the same
 * test.
 */
export async function generateMetadata(): Promise<Metadata> {
  const metadata = pageMetadata({ title: "Notes", description, path: "/notes/" });
  return getNotes().length >= 2 ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

export default function NotesIndex() {
  const notes = getNotes();
  const words = notes.reduce((sum, p) => sum + p.wordCount, 0);

  return (
    <Shell current="writing">

      <PageHead
        title="Notes"
        eyebrow={
          <Link
            prefetch={false}
            href="/writing/"
            className="inline-flex min-h-6 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> All writing
          </Link>
        }
        lede="One finding each, as short as it can be told: the number or the surprise, the command or the file that shows it, and what it does not tell you."
        figures={
          notes.length > 0 && (
            <>
              <span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span>{" "}
              <span>{n(words)} words</span>{" "}
              <span>latest {formatDate(notes[0].date)}</span>
            </>
          )
        }
      />

      {notes.length > 0 ? (
        <section className="border-t py-10" aria-labelledby="notes-list">
          {/* A running head that states the order, as /writing/ does when sorted by length. */}
          <h2 id="notes-list" className="text-sm font-medium text-muted-foreground">Newest first</h2>
          {/* Every row here is a note, so no row says so. */}
          <PostList posts={notes} kinds={false} className="mt-6" />
        </section>
      ) : (
        <p className="border-t py-10 text-muted-foreground">
          None yet. Everything so far is under{" "}
          <Link className="link" prefetch={false} href="/writing/">Writing</Link>.
        </p>
      )}

    </Shell>
  );
}
