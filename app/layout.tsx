import type { Metadata, Viewport } from "next";
import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { site, feedTypes } from "@/lib/site";
import "./globals.css";

// Downloaded and self-hosted at build time — no request to Google from the browser,
// and no render-blocking cross-origin stylesheet on the critical path.
//
// Two faces, and only two. Prose and headings are the serif; every piece of
// metadata is the mono. A third family appearing here means the Marginalia rail
// has started leaking into the body — see docs/DESIGN-BRIEF.md.
const serif = Source_Serif_4({
  // cyrillic-ext carries "Hrabovskyi" and any Ukrainian strings.
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
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
  themeColor: "#100F0D",
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
      className={`${serif.variable} ${mono.variable}`}
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
