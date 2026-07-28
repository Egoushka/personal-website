import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site, feedTypes, skills, experience } from "@/lib/site";

const description =
  "Backend-leaning full-stack developer in Ukraine. C# / .NET and ASP.NET Core, Angular on the front end, and a homelab run like production.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about/", types: feedTypes },
  openGraph: {
    type: "profile",
    title: `About — ${site.name}`,
    description,
    url: `${site.url}/about/`,
    siteName: site.name,
    locale: site.locale,
  },
  twitter: { card: "summary_large_image", title: `About — ${site.name}`, description },
};

export default function About() {
  const current = experience.find((j) => j.when.includes("present"));

  return (
    <>
      <Nav />
      <main id="main">
        <section className="page-head" aria-labelledby="about-heading">
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> cat about.md</div>
            <h1 id="about-heading">About</h1>

            <p className="about-lead">
              I&apos;m a backend-leaning full-stack developer based in Ukraine.
              {current && ` Currently a ${current.role.split(" · ")[0]} at ${current.company}, `}
              working on backend services for a white-label crypto trading platform.
            </p>

            <p>
              Day to day that means <strong>C# / .NET and ASP.NET Core</strong>, with Angular
              and TypeScript when the work reaches the front end. I care about the parts that
              don&apos;t show up in a demo: error handling, observability, predictable
              behaviour under load, and code the next person can read without a meeting.
            </p>

            <h2>How I got here</h2>
            <p>
              I started at GlobalLogic in 2021 and have worked across Umbraco-based .NET
              systems, greenfield Clean Architecture backends, and now fintech. The path
              wasn&apos;t a straight line — there is a two-month gap in 2024 where I took a
              sales job while looking for engineering work. It&apos;s on the{" "}
              <Link href="/resume/">résumé</Link> rather than quietly removed, because a
              tidied-up history is worth less than an honest one.
            </p>

            <h2>The homelab</h2>
            <p>
              Outside work I run a small homelab on a single VPS — a deliberate way to learn
              infrastructure properly: networking, secrets management, reverse proxies, and
              the difference between &quot;it works&quot; and &quot;it works at 3am.&quot;
              It&apos;s the cheapest environment I know for breaking production when
              production is only mine. I write about it in{" "}
              <Link href="/blog/">the blog</Link>, and the full stack is on{" "}
              <Link href="/uses/">/uses</Link>.
            </p>

            <h2>What I work with</h2>
            <div className="chips">
              {skills.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>

            <h2>Elsewhere</h2>
            <ul className="about-links">
              <li><a href={site.github} rel="noopener">github.com/{site.githubHandle}</a></li>
              <li><a href={site.linkedin} rel="noopener">linkedin.com/in/yehor-hrabovskyi</a></li>
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              <li><Link href="/now/">what I&apos;m doing now</Link></li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
