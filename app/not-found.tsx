import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="wrap notfound">
        <div className="prompt"><span className="dollar">$</span> cat page</div>
        <h1>404</h1>
        <p className="notfound-msg">No such file or directory.</p>
        <p>
          Try the <Link href="/blog/">blog</Link>,{" "}
          <Link href="/#projects">projects</Link>, or head{" "}
          <Link href="/">back home</Link>.
        </p>
      </main>
      <Footer />
    </>
  );
}
