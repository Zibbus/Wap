import { useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "../components/LoginModal";
import { motion } from "framer-motion";
import { useRef } from "react";

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
      <section ref={ref} className="relative w-full h-[600px] flex flex-col items-center justify-center text-center overflow-hidden mb-20 bg-black rounded-2xl">

        {/* Immagine di sfondo dinamica */}
        <motion.img
          src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1600&q=80"
          alt="Healthy lifestyle background"
          className="absolute inset-0 w-full h-full object-cover brightness-75 translate-x-[-33px] translate-y-[-20px]"
        />

        {/* Overlay trasparente */}
        <div className="absolute inset-0 bg-indigo-900/40" />

        {/* Contenuto */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 text-white max-w-2xl px-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg"
          >
            Il tuo benessere, il nostro obiettivo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg mb-8 text-indigo-100 leading-relaxed drop-shadow-md"
          >
            Crea la tua scheda di allenamento e nutrizione personalizzata con
            l’aiuto dei professionisti MyFit. Inizia oggi a migliorare la tua vita.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            onClick={() => setShowLogin(true)}
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg 
                       hover:bg-indigo-700 hover:scale-105 transform transition-all duration-200 
                       shadow-md cursor-pointer focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            Inizia ora
          </motion.button>
        </motion.div>
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

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoggedIn={(p) => login(p)}
        />
      )}
    </main>
  );
}
