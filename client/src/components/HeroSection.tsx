interface HeroSectionProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function HeroSection({ isLoggedIn, onLogin }: HeroSectionProps) {
  return (
    <section className="text-center py-16 px-6 bg-white shadow-inner">
      <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">
        Benvenuto su MyFit!
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto mb-6">
        Migliora la tua forma fisica e segui i tuoi progressi con i nostri strumenti
        intelligenti e il supporto di professionisti qualificati.
      </p>
      {!isLoggedIn && (
        <button
          onClick={onLogin}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105"
        >
          Accedi o Registrati
        </button>
      )}
    </section>
  );
}