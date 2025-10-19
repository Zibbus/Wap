interface HeroSectionProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function HeroSection({ isLoggedIn, onLogin }: HeroSectionProps) {
  return (
    <section className="relative w-full flex items-center justify-center py-24 px-6">
      <div className="text-center space-y-6 max-w-3xl">
        {/* Titolo con highlight dietro */}
        <h1 className="text-5xl font-extrabold leading-tight relative inline-block">
          <span className="relative z-10 text-gray-900">
            Raggiungi i tuoi obiettivi con MyFit
          </span>
          <span className="absolute inset-0 bg-indigo-100 -rotate-1 rounded-xl -z-10"></span>
        </h1>

        <p className="text-lg text-gray-600">
          Scopri come creare piani di allenamento personalizzati e segui i tuoi progressi passo dopo passo.
        </p>

        {!isLoggedIn && (
          <button
            onClick={onLogin}
            className="mt-6 bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:bg-indigo-700 hover:scale-105 transform transition-all duration-300"
          >
            Inizia ora
          </button>
        )}
      </div>
    </section>
  );
}
