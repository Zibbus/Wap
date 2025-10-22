import HeroSection from "../components/homepage/HeroSection";
import FeaturesSection from "../components/homepage/FeaturesSection";
import HowItWorksSection from "../components/homepage/HowItWorksSection";
import StatsSection from "../components/homepage/StatsSection";
import FadeInSection from "../components/homepage/FadeInSection";
import GameRunner from "../components/homepage/GameRunner";
import Footer from "../components/Layouts/footer/Footer";
import ImageCarousel from "../components/homepage/ImageCarousel";

export default function HomePage() {

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <main className="flex flex-col items-center">
        {/* 🔹 Carosello immagini */}
        <section className="w-full flex justify-center mt-10 mb-12 px-4">
          <ImageCarousel />
        </section>

        {/* 🔹 Hero principale */}
        <FadeInSection>
          <HeroSection />
        </FadeInSection>

        {/* 🔹 Features */}
        <FadeInSection>
          <FeaturesSection />
        </FadeInSection>

        {/* 🔹 Spazio e sezioni extra */}
        <div className="mb-24" />
        <FadeInSection>
          <HowItWorksSection />
        </FadeInSection>
        <FadeInSection>
          <StatsSection />
        </FadeInSection>

        {/* 🔹 Mini Gioco */}
        <GameRunner />
      </main>

      {/* 🔹 Footer */}
      <Footer />
    </div>
  );
}
