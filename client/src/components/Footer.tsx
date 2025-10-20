import { Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-indigo-700 text-white text-center py-12 mt-20 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 space-y-10">
        {/* 🔹 Sezione "Chi siamo" */}
        <section id="chi-siamo" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-wide uppercase text-white drop-shadow">
            Chi siamo
          </h2>
          <p className="text-sm sm:text-base text-indigo-100 leading-relaxed max-w-3xl mx-auto">
            MyFit è una piattaforma innovativa dedicata al benessere fisico e mentale.  
            Connettiamo utenti e professionisti del fitness per offrire percorsi di allenamento personalizzati,
            monitoraggio dei progressi e supporto costante per raggiungere i tuoi obiettivi.
          </p>

          <div className="text-sm text-indigo-200 mt-3 space-y-1">
            <p>
              📍 Sede legale: Via del Benessere 21, Bari (BA) — P.IVA 12345678901
            </p>
            <p>
              ✉️{" "}
              <a
                href="mailto:support@myfit.com"
                className="underline hover:text-white transition-colors"
              >
                support@myfit.com
              </a>{" "}
              — ☎️ +39 055 1234567
            </p>
          </div>
        </section>

        {/* 🔹 Divider */}
        <hr className="border-indigo-500/30 my-6 mx-auto w-3/4" />

        {/* 🔹 Social */}
        <div className="flex justify-center gap-8">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>

        {/* 🔹 Copyright */}
        <p className="text-sm text-indigo-200 mt-8">
          © {new Date().getFullYear()} MyFit — Tutti i diritti riservati.
        </p>
      </div>

      {/* 🔹 Effetto gradiente sfumato dietro il footer */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400"></div>
    </footer>
  );
}
