import { Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-indigo-700 text-white text-center py-16 mt-20 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        {/* 🔹 Sezione "Chi siamo" */}
        <section id="chi-siamo" className="space-y-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-wide text-white drop-shadow-md">
            Chi siamo
          </h2>

          <p className="text-base sm:text-lg text-indigo-100 leading-relaxed max-w-3xl mx-auto">
            <strong>MyFit</strong> è una piattaforma innovativa dedicata al benessere fisico e mentale.  
            Mettiamo in contatto utenti e professionisti del fitness per creare percorsi di allenamento e nutrizione personalizzati, 
            offrendo monitoraggio dei progressi e supporto costante verso i tuoi obiettivi.
          </p>

          <div className="text-sm sm:text-base text-indigo-200 mt-4 space-y-1">
            <p>📍 <strong>Sede legale:</strong> Via del Benessere 21, Bari (BA) — P.IVA 12345678901</p>
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
        <hr className="border-indigo-500/40 mx-auto w-3/4" />

        {/* 🔹 Social media */}
        <div className="flex justify-center gap-10">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
            aria-label="Facebook"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white transition-all transform hover:scale-110"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>

        {/* 🔹 Copyright */}
        <p className="text-sm text-indigo-200">
          © {new Date().getFullYear()} <strong>MyFit</strong> — Tutti i diritti riservati.
        </p>
      </div>

      {/* 🔹 Effetto gradiente decorativo */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400"></div>
    </footer>
  );
}
