import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site, feedTypes } from "@/lib/site";

const description = `Search everything on ${site.domain} — posts, projects and notes.`;

export const metadata: Metadata = {
  title: "Search",
  description,
  alternates: { canonical: "/search/", types: feedTypes },
  // A search page has nothing to index and no business in results.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    title: `Search — ${site.name}`,
    description,
    url: `${site.url}/search/`,
    siteName: site.name,
    locale: site.locale,
  },
};

export default function Search() {
  return (
    <>
      <main id="main" className="wrap">
        <Nav />

        <span className="rail rail--label">Search</span>
        <h1 id="search-heading">Search</h1>

        {/*
          Pagefind builds its own UI into this container and needs a real DOM
          node to mount into. It is loaded from a plain script rather than a
          client component: the whole index is static files, and importing it
          through React would drag hydration onto the page for no benefit.
          data-pagefind-ignore keeps this page out of its own index.
          Its palette comes from the --pagefind-ui-* custom properties mapped in
          globals.css — mapping its variables beats fighting its stylesheet.
        */}
        <div id="search" className="search" data-pagefind-ignore />

        <noscript>
          <p>
            Search needs JavaScript. Everything is also listed under{" "}
            <Link href="/writing/">writing</Link> and{" "}
            <Link href="/projects/">projects</Link>.
          </p>
        </noscript>

        <Footer />
      </main>

      <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
      <script src="/pagefind/pagefind-ui.js" defer />
      {/*
        Mount as soon as PagefindUI exists rather than waiting on `load`. React
        hoists this script into <head>, so it can execute *after* load has already
        fired — in which case a load listener never runs and the box silently
        never appears. Bounded poll, with an honest message if the index is gone.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var el=document.getElementById("search"), tries=0;
  (function go(){
    if(window.PagefindUI){
      new window.PagefindUI({element:"#search",showSubResults:true,showImages:false,pageSize:10});
      return;
    }
    if(++tries>100){ el.textContent="Search is unavailable right now."; return; }
    setTimeout(go,50);
  })();
})();`,
        }}
      />
    </>
  );
}
