import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Card from "./Card";

type Feature = {
  image: string;
  title: string;
  description: string;
  goTo: string;
  protected?: boolean;
};

export default function FeaturesSection() {
  const navigate = useNavigate();
  const { authData } = useAuth();
  const isLoggedIn = !!authData;

  const features: Feature[] = [
    {
      image: "https://plus.unsplash.com/premium_photo-1682435082476-b2d992a7e1ce?auto=format&fit=crop&q=80&w=1487",
      title: "Crea il tuo piano di allenamento personalizzato",
      description: "Progetta il tuo piano su misura in base ai tuoi obiettivi e al tuo livello di forma fisica. Ogni allenamento è pensato per te.",
      goTo: "/workout",
      protected: true,
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1706544427260-a3fc8c6272a1?auto=format&fit=crop&q=80&w=1567",
      title: "Crea il tuo piano nutrizionale personalizzato",
      description: "Consulta piani alimentari bilanciati e personalizzati creati da nutrizionisti esperti.",
      goTo: "/nutrizione",
    },
    {
      image: "https://images.unsplash.com/photo-1616587226960-4a03badbe8bf?auto=format&fit=crop&q=80&w=1170",
      title: "Confrontati con i professionisti",
      description: "Segui i consigli dei coach, monitora i tuoi progressi e migliora costantemente giorno dopo giorno.",
      goTo: "/professionisti",
    },
  ];

  const handleFeatureClick = (f: Feature) => {
    if (f.protected && !isLoggedIn) {
      window.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }
    navigate(f.goTo);
  };

  return (
    <section className="py-16 px-6 bg-indigo-50 dark:bg-gray-950">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 mb-10">Scopri cosa puoi fare</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto justify-items-center items-stretch">
        {features.map((f, i) => (
          <div key={i} onClick={() => handleFeatureClick(f)} className="cursor-pointer transform hover:scale-105 transition-all duration-300 w-full flex justify-center">
            <div className="w-96 h-[520px] flex">
              <Card imageUrl={f.image} title={f.title} description={f.description} onClick={() => handleFeatureClick(f)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
