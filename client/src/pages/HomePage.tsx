import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import StatsSection from "../components/StatsSection";
import FadeInSection from "../components/FadeInSection";
import GameRunner from "../components/GameRunner";
import Footer from "../components/Footer";
import ImageCarousel from "../components/ImageCarousel";

interface HomePageProps {
  auth: any;
  onLogin: () => void;
}

export default function HomePage({ auth, onLogin }: HomePageProps) {
  const isLoggedIn = !!auth;

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <main className="flex flex-col items-center">
        <section className="w-full flex justify-center mt-10 mb-12 px-4">
          <ImageCarousel />
        </section>

        <FadeInSection>
          <HeroSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </FadeInSection>

        <FadeInSection>
          <FeaturesSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </FadeInSection>

        <FadeInSection>
          <HowItWorksSection />
        </FadeInSection>

        <FadeInSection>
          <StatsSection />
        </FadeInSection>

        <GameRunner />
      </main>

      <Footer />
    </div>
  );
}