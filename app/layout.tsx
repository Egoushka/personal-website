import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { site, feedTypes } from "@/lib/site";
import "./globals.css";

// Downloaded and self-hosted at build time — no request to Google from the
// browser, and no render-blocking cross-origin stylesheet on the critical path.
//
// ONE family now. Literata set the prose and it was the single thing that made
// this site read as older than it is: a serif at 19px on a 1.72 leading is an
// editorial setting, and this is not a magazine. Inter carries the whole site,
// and the metadata that used to be set in it has moved to the system monospace
// — which costs nothing to load and reads as a developer rather than a
// broadsheet.
const prose = Inter({
  // cyrillic carries "Hrabovskyi" and any Ukrainian strings.
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-prose",
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
  alternates: { canonical: "/", types: feedTypes },
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: site.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={prose.variable}
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
        <a className="skip-link" href="#main">Skip to content</a>
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
