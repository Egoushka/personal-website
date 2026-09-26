import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { site, feedTypes, isPrelive } from "@/lib/site";
import "./globals.css";

// Downloaded and self-hosted at build time — no request to Google from the
// browser, and no render-blocking cross-origin stylesheet on the critical path.
//
// Inter reads everything. It also set every heading, and one grotesk doing all
// three jobs is why the site read as one long undifferentiated column: the
// only thing separating a title from a paragraph was eight points of size.
const prose = Inter({
  // Preload Latin only: every name on the site, "Hrabovskyi" included, is
  // Latin script. The Cyrillic face is still declared and loads through its
  // unicode-range only on a page that prints a Cyrillic character.
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-prose",
});

// Titles only.
//
// A second grotesk rather than a serif. Bricolage is a display grotesk with
// actual opinions — flat-sided bowls, a tight double-storey g, terminals cut
// at angles Inter would never allow — so at 28px and up it does not read as
// Inter-but-bigger, which is the entire job.
//
// Variable, so `weight` is omitted and globals.css asks for 600 directly. No
// Cyrillic subset: anything outside latin falls through to the stack below it.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  // Feeds only. Anything here is inherited by every page that sets none, so a
  // canonical here would make each 404 a copy of the home page. Canonicals
  // and cards are per page, from pageMetadata() in lib/metadata.ts.
  alternates: { types: feedTypes },
  // robots.txt is a request a crawler may ignore for a page it reached by link;
  // this is the one that binds. Absent entirely on a production build.
  ...(isPrelive ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  // --paper, both themes. Keep these two in step with globals.css.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0D" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The pre-paint script below sets `data-theme` before React hydrates, so
    // the attribute legitimately differs from the server's HTML.
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${prose.variable} ${display.variable}`}
    >
      <body>
        {/*
          Runs before anything paints, so a reader who chose a theme never sees
          the other one first. It is inline and un-deferred on purpose: a
          request for this would be a request that has to finish before the
          first frame, which is the flash it exists to prevent.

          Everything it can throw is caught. Blocked storage means no stored
          choice, which is the same as never having made one, and the media
          query in globals.css takes over.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <a className="skip-link" href="#main" data-pagefind-ignore>Skip to content</a>
        {children}
        {/*
          Umami, self-hosted. Served first-party via the edge Traefik router, NOT from
          umami.lab.hrabovskyi.online — that name resolves to 100.64.0.2 and is reachable
          only on the tailnet, so visitors would get nothing. Going through /s/script.js
          also keeps third-party origins at zero, leaves ad-blocker domain lists nothing
          to match, and lets the CSP stay at script-src 'self'.
          The website ID is a public identifier, not a secret — it ships in every page.
        */}
        <script
          defer
          src="/s/script.js"
          data-website-id="fd5da82a-ef38-46c5-8c7e-46ad293df97f"
        />
      </body>
    </html>
  );
}
