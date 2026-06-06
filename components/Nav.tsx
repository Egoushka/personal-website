import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="inner">
        <Link className="brand" href="/">
          <span className="accent">&gt;</span> hrabovskyi<span className="accent">.online</span>
        </Link>
        <div className="links">
          <Link href="/#projects">projects</Link>
          <Link href="/#experience" className="hide-sm">experience</Link>
          <Link href="/#homelab" className="hide-sm">homelab</Link>
          <Link href="/blog/">blog</Link>
          <Link href="/#contact">contact</Link>
        </div>
      </div>
    </nav>
  );
}
