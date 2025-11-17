// client/src/pages/HomePage.tsx
import HeroSection from "../components/homepage/HeroSection";
import FeaturesSection from "../components/homepage/FeaturesSection";
import HowItWorksSection from "../components/homepage/HowItWorksSection";
import StatsSection from "../components/homepage/StatsSection";
import FadeInSection from "../components/homepage/FadeInSection";
import GameRunner from "../components/homepage/GameRunner";
import ImageCarousel from "../components/homepage/ImageCarousel";
import { usePageTitle } from "../hooks/usePageTitle";

export default function HomePage() {
  usePageTitle("Homepage");

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white text-gray-800 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100">
      <main className="flex flex-col items-center">
        {/* 🔹 Carosello immagini */}
        <section className="w-full flex justify-center mt-10 mb-12 px-4">
          <div className="max-w-5xl w-full">
            <ImageCarousel />
          </div>
        </section>

        {/* 🔹 Hero principale */}
        <FadeInSection>
          <HeroSection />
        </FadeInSection>

        {/* 🔹 Features */}
        <FadeInSection>
          <FeaturesSection />
        </FadeInSection>

        {/* 🔹 Sezioni extra */}
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
    </div>
  );
}
