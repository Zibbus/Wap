import HeroSection from "../components/homepage/HeroSection";
import FeaturesSection from "../components/homepage/FeaturesSection";
import HowItWorksSection from "../components/homepage/HowItWorksSection";
import StatsSection from "../components/homepage/StatsSection";
import FadeInSection from "../components/homepage/FadeInSection";
import GameRunner from "../components/homepage/GameRunner";
import Footer from "../components/homepage/Footer";
import ImageCarousel from "../components/homepage/ImageCarousel";

interface HomePageProps {
  auth: any;
  onLogin: () => void;
}

export default function HomePage({ auth, onLogin }: HomePageProps) {
  const isLoggedIn = !!auth;

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <main className="flex flex-col items-center">
        {/* 🔹 Sezione Hero con il carosello */}
        <section className="w-full flex justify-center mt-10 mb-12 px-4">
          <ImageCarousel />
        </section>

        {/* 🔹 Hero principale */}
        <FadeInSection>
          <HeroSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </FadeInSection>

        {/* 🔹 Sezione Features */}
        <FadeInSection>
          <FeaturesSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </FadeInSection>

        {/* 🟣 Spazio extra tra Features e HowItWorks */}
        <div className="mb-24" />

        {/* 🔹 Come funziona */}
        <FadeInSection>
          <HowItWorksSection />
        </FadeInSection>

        {/* 🔹 Statistiche animate */}
        <FadeInSection>
          <StatsSection />
        </FadeInSection>

        {/* 🔹 Mini gioco */}
          <GameRunner />
      </main>

      {/* 🔹 Footer */}
      <Footer />
    </div>
  );
}
