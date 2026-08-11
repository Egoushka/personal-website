import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/** The joke is from the deploy post. It earns its place on exactly one page. */
export default function NotFound() {
  return (
    <main id="main" className="wrap">
      <Nav />
      <span className="rail rail--against-body">404</span>
      <div className="notfound">
        <h1>404</h1>
        <p>
          Nothing at this address. It answered, but it isn&apos;t listening.
        </p>
        <p className="page-figures">
          <Link href="/">home</Link>
          <span className="sep">·</span>
          <Link href="/writing/">writing</Link>
          <span className="sep">·</span>
          <Link href="/projects/">projects</Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
