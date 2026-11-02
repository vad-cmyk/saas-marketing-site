import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Audience from "@/components/Audience";
import Proof from "@/components/Proof";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <Audience />
        <Proof />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
