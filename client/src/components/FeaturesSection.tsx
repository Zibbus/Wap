import { useNavigate } from "react-router-dom";
import Card from "./Card";

interface FeaturesSectionProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function FeaturesSection({ isLoggedIn, onLogin }: FeaturesSectionProps) {
  const navigate = useNavigate();

  const features = [
    {
      image:
        "https://plus.unsplash.com/premium_photo-1682435082476-b2d992a7e1ce?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1487",
      title: "Crea il tuo piano di allenamento personalizzato",
      description:
        "Progetta il tuo piano su misura in base ai tuoi obiettivi e al tuo livello di forma fisica. Ogni allenamento è pensato per te.",
      goTo: "/workout",
      protected: true,
    },
    {
      image:
        "https://plus.unsplash.com/premium_photo-1706544427260-a3fc8c6272a1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1567",
      title: "Crea il tuo piano nutrizionale personalizzato",
      description:
        "Consulta piani alimentari bilanciati e personalizzati creati da nutrizionisti esperti.",
      goTo: "/nutrizione",
    },
    {
      image:
        "https://images.unsplash.com/photo-1616587226960-4a03badbe8bf?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
      title: "Confrontati con i professionisti",
      description:
        "Segui i consigli dei coach, monitora i tuoi progressi e migliora costantemente giorno dopo giorno.",
      goTo: "/statistiche",
    },
  ];

  const handleFeatureClick = (feature: typeof features[number]) => {
    if (feature.protected && !isLoggedIn) {
      onLogin();
      return;
    }
    navigate(feature.goTo);
  };

  return (
    <section className="py-16 px-6 bg-indigo-50">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-10">
        Scopri cosa puoi fare
      </h2>

      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
          gap-10 max-w-7xl mx-auto justify-items-center items-stretch
        "
      >
        {features.map((f, i) => (
          <div
            key={i}
            onClick={() => handleFeatureClick(f)}
            className="cursor-pointer transform hover:scale-105 transition-all duration-300 w-full flex justify-center"
          >
            <div className="w-96 h-[520px] flex">
              <Card
                image={f.image}
                title={f.title}
                description={f.description}
                goTo={f.goTo}
                isLoggedIn={isLoggedIn}
                onLogin={onLogin}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}