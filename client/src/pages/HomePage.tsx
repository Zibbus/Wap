import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import GameRunner from "../components/GameRunner";
import Footer from "../components/Footer";
import ImageCarousel from "../components/ImageCarousel"; // ✅

interface HomePageProps {
  auth: any;
  onLogin: () => void;
}

export default function HomePage({ auth, onLogin }: HomePageProps) {
  const isLoggedIn = !!auth;

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      <main className="flex flex-col items-center">
        {/* ✅ Carousel in alto */}
        <section className="w-full flex justify-center mt-10 mb-12 px-4">
          <ImageCarousel />
        </section>

        {/* ✅ Hero Section */}
        <section className="w-full mb-20">
          <HeroSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </section>

        {/* ✅ Spazio extra tra Hero e Features */}
        <section className="w-full mt-12">
          <FeaturesSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        </section>

        <GameRunner />
      </main>

      <Footer />
    </div>
  );
}
