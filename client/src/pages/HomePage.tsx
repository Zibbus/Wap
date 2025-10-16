import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion} from "framer-motion";
import { Menu, User, ArrowLeft, Mail, Phone, Facebook, Instagram, Linkedin } from "lucide-react";
import Card from "../components/Card";
import LoginModal from "../components/LoginModal";
import GameRunner from "../components/GameRunner";
import logo from "../assets/logo.png";
import logoecommerce from "../assets/logoecommerce.png";

type HomePageProps = {
  auth: { username: string } | null;
  onLogin: () => void;
};

export default function HomePage({ auth, onLogin }: HomePageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const footerRef = useRef<HTMLElement | null>(null);

  // 🔹 Scrolla fino al footer con animazione
  const scrollToFooter = () => {
    setShowSidebar(false);
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔹 Chiude sidebar e menu utente con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSidebar(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <main className="relative flex-1 max-w-6xl mx-auto px-4 py-12">
      {/* 🔹 NAVBAR */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 px-6 py-4 flex justify-between items-center">
        {/* Logo ecommerce */}
        <Link
          to="/shop"
          className="flex items-center gap-2"
          onClick={() => {
            setShowSidebar(false);
            setShowUserMenu(false);
          }}
        >
          <img
            src={logo}
            alt="MyFit Shop Logo"
            className="h-10 w-auto hover:scale-105 transition-transform"
          />
          <span className="text-2xl font-bold text-indigo-700">MyFit</span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Profilo utente */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Overlay e menu profilo */}
            {showUserMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowUserMenu(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-16 w-48 bg-white rounded-lg shadow-lg py-2 border z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {auth ? (
                    <>
                      <Link
                        to="/profilo"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 hover:bg-indigo-50"
                      >
                        👤 Profilo
                      </Link>
                      <Link
                        to="/impostazioni"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 hover:bg-indigo-50"
                      >
                        ⚙️ Impostazioni
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          console.log("logout");
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        🚪 Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLogin(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50"
                    >
                      🔑 Login
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </div>

          {/* Bottone menu laterale */}
          <button
            onClick={() => {
              setShowSidebar(!showSidebar);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-indigo-700" />
          </button>
        </div>
      </header>

      {/* Spazio per non sovrapporre la navbar */}
      <div className="pt-24"></div>

      {/* 🌟 HERO SECTION ANIMATA */}
      <section
        className="relative w-full h-[620px] flex flex-col items-center justify-center text-center overflow-hidden mb-20 bg-black rounded-2xl
        transition-transform duration-700 ease-in-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl"
      >
        <motion.img
          src="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=1600&q=80"
          alt="Allenamento al tramonto sul lungomare"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        <div className="absolute inset-0 bg-indigo-900/40"></div>

        <div className="relative z-10 text-white max-w-2xl px-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-extrabold mb-4"
          >
            Il tuo benessere, il nostro obiettivo
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg mb-8 text-indigo-100 leading-relaxed"
          >
            Crea la tua scheda di allenamento e nutrizione personalizzata con
            l’aiuto dei professionisti MyFit. Inizia oggi a migliorare la tua vita.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            onClick={onLogin}
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg 
            hover:bg-indigo-700 hover:scale-105 transform transition-all duration-200 shadow-md"
          >
            Inizia ora
          </motion.button>
        </div>
      </section>

      {/* 🔹 Schede funzionalità */}
      <section className="mt-16 flex flex-col sm:flex-row justify-center gap-8 pb-20">
        <Card
          image="https://via.placeholder.com/300x200?text=Allenamento"
          title="Crea la tua scheda di allenamento"
          description="Personalizza gli esercizi e organizza la tua scheda per raggiungere i tuoi obiettivi con il supporto della piattaforma."
          isLoggedIn={!!auth}
          onLogin={onLogin}
          goTo="/workout/new"
        />
        <Card
          image="https://via.placeholder.com/300x200?text=AI"
          title="Parla con l'IA"
          description="Interagisci con l’intelligenza artificiale per ricevere risposte immediate e consigli mirati su allenamento e nutrizione."
          isLoggedIn={!!auth}
          onLogin={onLogin}
          goTo="/ai-chat"
        />
        <Card
          image="https://via.placeholder.com/300x200?text=Professionisti"
          title="Confrontati con i professionisti"
          description="Accedi a personal trainer e nutrizionisti reali per costruire piani su misura e ricevere supporto diretto."
          isLoggedIn={!!auth}
          onLogin={onLogin}
          goTo="/professionisti"
        />
      </section>

      {/* 🕹️ Minigioco */}
      <section className="mt-24">
        <GameRunner />
      </section>

      {/* Modal login */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoggedIn={() => setShowLogin(false)}
        />
      )}

      {/* 🔹 SIDEBAR LATERALE */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSidebar(false);
          }}
        >
          <aside
            className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg flex flex-col animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center p-4 border-b">
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-indigo-100 rounded-full mr-2"
              >
                <ArrowLeft className="w-6 h-6 text-indigo-700" />
              </button>
              <h2 className="text-lg font-semibold text-indigo-700">Menu</h2>
            </div>

            <nav className="flex flex-col p-4 gap-3">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-indigo-600"
                onClick={() => setShowSidebar(false)}
              >
                <img src={logoecommerce} alt="" className="h-6 w-auto" /> Shop
              </div>
              <button onClick={scrollToFooter} className="text-left hover:text-indigo-600">
                Chi siamo
              </button>
              <button onClick={scrollToFooter} className="text-left hover:text-indigo-600">
                Contatti
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/*FOOTER*/}
      <footer>
        <motion.footer
          ref={footerRef}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`w-full mt-32 bg-gradient-to-b from-white via-indigo-50/40 to-indigo-100/20
            border-t border-indigo-200 pt-12 pb-6 text-gray-700 relative overflow-hidden
            shadow-[0_0_25px_rgba(99,102,241,0.25)]`}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-10 px-6">
            {/* Chi siamo */}
            <div className="max-w-xs text-center sm:text-left">
              <h3 className="text-xl font-semibold text-indigo-700 mb-3">Chi siamo</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                MyFit è una piattaforma dedicata al benessere personale, nata per unire
                tecnologia, salute e motivazione. Creiamo soluzioni per migliorare la tua vita.
              </p>
            </div>

            {/* Contatti */}
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold text-indigo-700 mb-3">Contatti</h3>
              <p className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-indigo-600" /> info@myfit.it
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600 mt-1">
                <Phone className="w-4 h-4 text-indigo-600" /> +39 333 123 4567
              </p>
            </div>

            {/* Social */}
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold text-indigo-700 mb-3">Seguici</h3>
              <div className="flex justify-center sm:justify-start gap-4 text-indigo-600">
                <Facebook className="w-5 h-5 cursor-pointer hover:scale-110 hover:text-indigo-700 transition-transform duration-200" />
                <Instagram className="w-5 h-5 cursor-pointer hover:scale-110 hover:text-indigo-700 transition-transform duration-200" />
                <Linkedin className="w-5 h-5 cursor-pointer hover:scale-110 hover:text-indigo-700 transition-transform duration-200" />
              </div>
            </div>
          </div>

          {/* Linea + copyright */}
          <div className="border-t border-indigo-200 mt-6 pt-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} <span className="text-indigo-700 font-semibold">MyFit</span> · React + TypeScript  
            <br className="sm:hidden" /> Tutti i diritti riservati.
          </div>

          {/* Effetto glow animato leggero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
            className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400 animate-pulse rounded-full"
          />
        </motion.footer>
      </footer>
    </main>
  );
}
