import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site, feedTypes, uses } from "@/lib/site";

const description =
  "The hardware, services and tools I actually use — a single Hetzner VPS run like production, plus the day-to-day .NET kit.";

export const metadata: Metadata = {
  title: "Uses",
  description,
  alternates: { canonical: "/uses/", types: feedTypes },
  openGraph: {
    type: "website",
    title: `Uses — ${site.name}`,
    description,
    url: `${site.url}/uses/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `Uses — ${site.name}`, description },
};

export default function Uses() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="page-head" aria-labelledby="uses-heading">
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> cat uses.md</div>
            <h1 id="uses-heading">Uses</h1>
            <p className="section-intro">
              What actually runs my work and my lab. Not aspirational — this is the
              current state, and the server half of it is version-controlled.
            </p>

            {uses.map((group) => (
              <div key={group.group} className="uses-group">
                <h2>{group.group}</h2>
                <div className="stack-grid">
                  {group.items.map((item) => (
                    <div className="stack-item" key={item.name}>
                      <div className="name"><span className="accent">▸</span> {item.name}</div>
                      <div className="desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
