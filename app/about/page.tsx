import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Picture, { hasPicture } from "@/components/Picture";
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
    <main id="main" className="wrap">
      <Nav current="about" />

      {/*
        The rail carries the standing facts and the contact block. "Elsewhere"
        is where /uses/ and /now/ live: second-visit content, annotated in the
        margin of the page someone reads when they already like the site —
        rather than spending two of five primary nav slots on it.
      */}
      <div className="rail hero-rail">
        <span>Kyiv, Ukraine</span>
        <span>since 2021</span>
        <a href={`mailto:${site.email}`}>email</a>
        <a href={site.github} rel="noopener">github</a>
        <a href={site.linkedin} rel="noopener">linkedin</a>

        <span className="rail--group rail--label">Elsewhere</span>
        <Link href="/uses/">what I use →</Link>
        <Link href="/now/">what I&apos;m doing now →</Link>
      </div>

      <div className="prose">
          <h1 id="about-heading">About</h1>

          {/* Appears as soon as assets/images/portrait.jpg exists — see
              assets/images/README.md. No code change needed to turn it on. */}
          {hasPicture("portrait") && (
            <Picture
              name="portrait"
              alt="Yehor Hrabovskyi"
              className="portrait"
              sizes="(max-width: 560px) 140px, 180px"
              priority
            />
          )}

            <p>
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
            <p className="skills-run">{skills.join(" · ")}</p>
      </div>

      <Footer />
    </main>
  );
}
