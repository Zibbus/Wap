import { useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "../components/LoginModal";
import { motion } from "framer-motion";
import { useRef } from "react";
import GameRunner from "../components/GameRunner";

export default function HomePage() {
  const { auth, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // 👇 questa funzione apre il popup di login
  const handleLoginOpen = () => setShowLogin(true);
  const ref = useRef(null);

  return (
    <main className="flex-1 max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-indigo-700 text-center mb-12">
        Benvenuto in MyFit
      </h1>

      {/* 🌟 HERO SECTION ANIMATA */}
      <section
        ref={ref}
        className="relative w-full h-[620px] flex flex-col items-center justify-center text-center overflow-hidden mb-20 bg-black rounded-2xl -mt-[2px]
                  transition-transform duration-700 ease-in-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl"
      >

        {/* Immagine con effetto zoom on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <motion.img
            ref={ref}
            src="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=1600&q=80"
            alt="Allenamento al tramonto sul lungomare"
            className="w-full h-full object-cover brightness-75 translate-x-[-25px] translate-y-[-20px] 
                      transition-transform duration-700 ease-in-out group-hover:scale-105"
          />
        </motion.div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-indigo-900/40 transition-opacity duration-700 group-hover:bg-indigo-900/30"></div>

        {/* Testo e bottone */}
        <div className="relative z-10 text-white max-w-2xl px-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg"
          >
            Il tuo benessere, il nostro obiettivo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg mb-8 text-indigo-100 leading-relaxed drop-shadow-md"
          >
            Crea la tua scheda di allenamento e nutrizione personalizzata con
            l’aiuto dei professionisti MyFit. Inizia oggi a migliorare la tua vita.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            onClick={() => setShowLogin(true)}
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg 
                      hover:bg-indigo-700 hover:scale-105 transform transition-all duration-200 
                      shadow-md cursor-pointer focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            Inizia ora
          </motion.button>
        </div>
      </section>

      <section className="mt-16 flex flex-col sm:flex-row justify-center gap-8 pb-20">
        <Card
          image="https://via.placeholder.com/300x200?text=Allenamento"
          title="Crea la tua scheda di allenamento"
          description="Personalizza gli esercizi e organizza la tua scheda per raggiungere i tuoi obiettivi con il supporto della piattaforma."
          isLoggedIn={!!auth}
          onLogin={handleLoginOpen} // ✅ uso la funzione dichiarata sopra
          goTo="/workout/new"
        />

        <Card
          image="https://via.placeholder.com/300x200?text=AI"
          title="Parla con l'IA"
          description="Interagisci con l’intelligenza artificiale per ricevere risposte immediate e consigli mirati su allenamento e nutrizione."
          isLoggedIn={!!auth}
          onLogin={handleLoginOpen}
          goTo="/ai-chat"
        />

        <Card
          image="https://via.placeholder.com/300x200?text=Professionisti"
          title="Confrontati con i professionisti"
          description="Accedi a personal trainer e nutrizionisti reali per costruire piani su misura e ricevere supporto diretto."
          isLoggedIn={!!auth}
          onLogin={handleLoginOpen}
          goTo="/professionisti"
        />
      </section>

      <section className="mt-24">
        <GameRunner />
      </section>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoggedIn={(p) => login(p)}
        />
      )}
    </main>
  );
}
