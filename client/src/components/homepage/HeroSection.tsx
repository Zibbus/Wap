import { useAuth } from "../../hooks/useAuth";

export default function HeroSection() {
  const { authData } = useAuth();
  const isLoggedIn = !!authData;

  return (
    <section className="relative w-full flex items-center justify-center py-20 px-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-3xl px-12 py-14 text-center shadow-xl max-w-4xl w-full dark:from-indigo-700 dark:to-indigo-600">
        <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">Raggiungi i tuoi obiettivi con MyFit</h1>
        <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10">Scopri come creare piani di allenamento personalizzati e segui i tuoi progressi passo dopo passo.</p>
        {!isLoggedIn && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openLoginModal"))}
            className="bg-white text-indigo-600 font-semibold px-10 py-3 rounded-xl shadow-md hover:bg-indigo-50 hover:scale-105 transform transition-all dark:bg-gray-900 dark:text-indigo-200 dark:hover:bg-gray-800"
          >
            Inizia ora
          </button>
        )}
      </div>
    </section>
  );
}
