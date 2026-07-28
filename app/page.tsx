import Nav from "@/components/Nav";
import { PersonAndSiteLd } from "@/components/JsonLd";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Homelab from "@/components/Homelab";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <main id="main">
        <PersonAndSiteLd />
        <About />
        <Projects />
        <Experience />
        <Homelab />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
