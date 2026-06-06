import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on backend engineering, debugging, and running a homelab — by Yehor Hrabovskyi.",
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <>
      <Nav />
      <main>
        <section style={{ borderTop: "none", paddingTop: 80 }}>
          <div className="wrap">
            <div className="prompt"><span className="dollar">$</span> ls ./blog</div>
            <h2 style={{ fontSize: 30 }}>Writing</h2>
            <p style={{ color: "var(--muted)", maxWidth: "58ch" }}>
              Debug stories, backend notes, and homelab logs. Mostly the things
              I&apos;d want to have read before I learned them the hard way.
            </p>
            <div className="post-list" style={{ marginTop: 18 }}>
              {posts.map((p) => (
                <Link className="post-row" href={`/posts/${p.slug}/`} key={p.slug}>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                  </div>
                  <span className="date">{formatDate(p.date)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
