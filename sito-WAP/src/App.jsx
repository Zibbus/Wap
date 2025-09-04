import './App.css'

//Tutte le componenti
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Section from "./components/Section.jsx";
import FeatureList from "./components/FeatureList.jsx";
import ShopCard from "./components/ShopCard.jsx";
import ContactForm from "./components/ContactForm.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  
  const navItems = [
    { label: "Chi siamo?", href: "#chi-siamo"},
    { label: "Contattaci", href: "#contattaci"},
    { label: "Shop", href: "#shop"},
    { label: "Login", href: "#login"},
  ];

  return (
     <div className="min-h-screen bg-white text-gray-900">
        <Navbar brand="Fit&Fuel" navItems={navItems} />

        <Hero
          bgUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
          eyebrow="Palestra & Nutrizione"
          title={
            <>
              Allenati con metodo,
              <br className="hidden md:block" /> nutri il tuo benessere
            </>
          }
          subtitle="Programmi di allenamento personalizzati e piani nutrizionali basati su evidenze. Il tuo percorso verso performance e salute inizia qui."
          ctaPrimary={{ href: "#shop", label: "Scopri i piani" }}
          ctaSecondary={{ href: "#contattaci", label: "Parlane con noi" }}
        />

        <main className="relative z-10">
          <Section id="chi-siamo" title="Chi siamo">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <p className="text-gray-600">
                  Team certificato di coach e nutrizionisti. Filosofia: approccio integrato,
                  misurabile e sostenibile nel tempo. Niente slogan, solo risultati.
                </p>
                <FeatureList
                  items={[
                    "Valutazioni iniziali e follow-up periodici",
                    "Programmi di forza, dimagrimento e performance",
                    "Educazione alimentare e meal plan personalizzati",
                  ]}
                />
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
                <img
                  className="h-64 w-full rounded-xl object-cover"
                  src="https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=2070&auto=format&fit=crop"
                  alt="Area pesi e alimentazione equilibrata"
                />
            </div>
          </div>
        </Section>

        <Section id="shop" title="Shop" muted>
          <p className="max-w-2xl text-gray-600">
            Abbonamenti, pacchetti visite e consulenze nutrizionali. Presto online.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Abbonamento Palestra", "Visita + Piano Nutrizionale", "Personal Training"].map(
              (name) => (
                <ShopCard key={name} title={name} />
              )
            )}
          </div>
        </Section>


        <Section id="contattaci" title="Contattaci">
          <p className="max-w-2xl text-gray-600">
            Scrivici per una prima consulenza gratuita. Ti rispondiamo entro 24 ore.
          </p>
          <ContactForm />
        </Section>
      </main>


      <Footer />
    </div>
  );
}
  

export default App
