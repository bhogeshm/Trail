import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <About />
      <Services />
      <Work />
      <Contact />
    </main>
  );
}
