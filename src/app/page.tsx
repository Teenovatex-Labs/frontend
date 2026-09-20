import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InterestStrip from "@/components/InterestStrip";
import About from "@/components/About";
import Toolkit from "@/components/Toolkit";
import FirstDay from "@/components/FirstDay";
import People from "@/components/People";
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
        <Join />
      </main>
      <Footer />
    </>
  );
}
