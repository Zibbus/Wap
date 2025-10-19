import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import GameRunner from "../components/GameRunner";
import Footer from "../components/Footer";

interface HomePageProps {
  auth: any;
  onLogin: () => void;
}

export default function HomePage({ auth, onLogin }: HomePageProps) {
  const isLoggedIn = !!auth;

  return (
    <div className="flex-1">
      <main>
        <HeroSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        <FeaturesSection isLoggedIn={isLoggedIn} onLogin={onLogin} />
        <GameRunner />
      </main>
      <Footer />
    </div>
  );
}