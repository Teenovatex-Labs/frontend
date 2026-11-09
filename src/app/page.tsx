import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InterestStrip from "@/components/InterestStrip";
import About from "@/components/About";
import Toolkit from "@/components/Toolkit";
import FirstDay from "@/components/FirstDay";
import People from "@/components/People";
import Teenovators from "@/components/Teenovators";
import Donate from "@/components/Donate";
import Contact from "@/components/Contact";
import Join from "@/components/Join";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <InterestStrip />
        <About />
        <Toolkit />
        <FirstDay />
        <People />
        <Teenovators />
        <Donate />
        <Contact />
        <Join />
      </main>
      <Footer />
    </>
  );
}
