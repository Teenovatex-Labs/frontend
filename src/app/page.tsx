import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InterestStrip from "@/components/InterestStrip";
import About from "@/components/About";
import Toolkit from "@/components/Toolkit";
import People from "@/components/People";
import Donate from "@/components/Donate";
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
        <People />
        <Donate />
      </main>
      {/* One yellow band: the call to action and the footer share a single background. */}
      <div className="relative overflow-hidden border-y border-ink bg-yellow">
        <img
          src="/assets/logo-long6.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07] md:w-[130%]"
        />
        <Join />
        <Footer merged />
      </div>
    </>
  );
}
