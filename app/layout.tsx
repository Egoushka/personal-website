import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { site, feedTypes } from "@/lib/site";
import "./globals.css";

// Downloaded and self-hosted at build time — no request to Google from the
// browser, and no render-blocking cross-origin stylesheet on the critical path.
//
// Inter reads everything. It also set every heading, and one grotesk doing all
// three jobs is why the site read as one long undifferentiated column: the
// only thing separating a title from a paragraph was eight points of size.
const prose = Inter({
  // cyrillic carries "Hrabovskyi" and any Ukrainian strings.
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-prose",
});

// Titles only, and never below ~21px.
//
// Literata was here once and it is the cautionary tale: a serif at 19px on a
// 1.72 leading set the *prose*, which is an editorial setting and made the
// site read a decade old. This is the opposite use. A high-contrast display
// serif at 28-52px against a grotesk body and a monospace rail is three clearly
// different voices, which is the whole point — one face at three sizes is not
// a hierarchy, it is a gradient.
//
// 400 only, upright and italic: this face has no bold and does not want one.
// No Cyrillic subset either, so anything outside latin falls through to the
// stack below it in globals.css.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
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
