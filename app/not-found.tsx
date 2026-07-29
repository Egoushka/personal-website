import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/** The joke is from the deploy post. It earns its place on exactly one page. */
export default function NotFound() {
  return (
    <main id="main" className="wrap">
      <Nav />
      <span className="rail hero-rail">404</span>
      <div className="hero notfound">
        <h1>404</h1>
        <p>
          No page at this address. It answered, but it isn&apos;t listening.{" "}
          <Link href="/">Back home</Link>.
        </p>
      </div>
      <Footer />
    </main>
  );
}
