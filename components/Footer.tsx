import { site } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-pagefind-ignore>
      <div className="inner">
        <div className="note">© {year} {site.name} · built &amp; self-hosted</div>
        <div className="social">
          <a href={site.github} target="_blank" rel="noopener">github</a>
          <a href={site.linkedin} target="_blank" rel="noopener">linkedin</a>
          <a href={`mailto:${site.email}`}>email</a>
        </div>
      </div>
    </footer>
  );
}
