import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PersonAndSiteLd } from "@/components/JsonLd";
import { site } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";

/**
 * One lead, then indexes.
 *
 * The old home page was six equal sections, so nothing led and a first-time
 * reader's opening seconds went on orienting. The newest post now carries the
 * only display weight besides the name, and the work index does in four lines
 * what those six sections were doing.
 */
export default function Home() {
  const [latest, ...older] = getAllPosts();

  return (
    <main id="main" className="wrap">
      <Nav current="home" />
      <PersonAndSiteLd />

      <div className="rail hero-rail">
        <span>Kyiv, UA</span>
        <span>.NET · ASP.NET Core</span>
        <span>Boerse Stuttgart Digital</span>
        <span className="open">open to work</span>
      </div>
      <div className="hero">
        <h1>{site.name}</h1>
        <p>
          I build and run reliable systems — backend services in .NET, the
          occasional Angular front end, and a self-hosted infrastructure stack I
          treat as a lab. I care about the parts that don&apos;t show up in a
          demo.
        </p>
      </div>

      {latest && (
        <>
          <hr className="bleed" />
          <div className="row">
            <span className="rail rail--label">Latest</span>
            <div className="lead-post post-item">
              <h2><Link href={`/posts/${latest.slug}/`}>{latest.title}</Link></h2>
              <p>{latest.description}</p>
              <Link className="more" href={`/posts/${latest.slug}/`}>
                read → {latest.readingTime} min
              </Link>
            </div>
          </div>
        </>
      )}

      {older.length > 0 && (
        <div className="row">
          <span className="rail rail--label">More</span>
          <ol className="post-list">
            {older.map((p) => (
              <li className="post-row" key={p.slug}>
                <Link href={`/posts/${p.slug}/`}>{p.title}</Link>
                <p>{p.description}</p>
                <span className="post-meta">
                  <time dateTime={p.date}>{p.date.slice(0, 7)}</time>
                  {` · ${p.readingTime} min`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <hr className="bleed" />
      <div className="row">
        <span className="rail rail--label">Work</span>
        <ul className="work-index">
          <li><Link href="/projects/">MetaExchange</Link><span className="qual">order books</span></li>
          <li><Link href="/projects/">NetworkMonitor</Link><span className="qual">homelab</span></li>
          <li><Link href="/resume/">Experience</Link><span className="qual">2021–now</span></li>
          <li><Link href="/uses/">Homelab</Link><span className="qual">one Hetzner box</span></li>
        </ul>
      </div>

      <Footer />
    </main>
  );
}
