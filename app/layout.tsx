import type { Metadata, Viewport } from "next";
import { Literata, Inter } from "next/font/google";
import { site, feedTypes } from "@/lib/site";
import "./globals.css";

// Downloaded and self-hosted at build time — no request to Google from the browser,
// and no render-blocking cross-origin stylesheet on the critical path.
//
// Two faces, and only two. Prose is the serif; every figure, label and nav item is
// the sans. A third family appearing here means something has started leaking.
const prose = Literata({
  // cyrillic-ext carries "Hrabovskyi" and any Ukrainian strings.
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-prose",
});

// Was Archivo Narrow, a condensed face drawn for dense tabular setting. That made
// sense when the home page was a four-column ledger; it makes none now, and a
// condensed face reads as tighter and more clipped than this site's voice. Inter
// carries tabular figures for the counted numbers and stays friendly at 12px.
const figure = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-figure",
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
  // --paper, dark theme. Keep these two in step with globals.css.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#191714" },
    { media: "(prefers-color-scheme: light)", color: "#FBF8F2" },
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
      className={`${prose.variable} ${figure.variable}`}
    >
      <body>
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
