import Card from "./Card";

interface FeaturesSectionProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function FeaturesSection({ isLoggedIn, onLogin }: FeaturesSectionProps) {
  const features = [
    {
      image: "https://plus.unsplash.com/premium_photo-1682435082476-b2d992a7e1ce?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1487",
      title: "Crea il tuo piano di allenamento personalizzato",
      description: "Crea il tuo piano di allenamento basato sui tuoi obiettivi e livello.",
      goTo: "/allenamenti",
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1706544427260-a3fc8c6272a1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1567",
      title: "Crea il tuo piano nutrizionale personalizzato",
      description: "Consulta piani alimentari creati da nutrizionisti esperti.",
      goTo: "/nutrizione",
    },
    {
      image: "https://images.unsplash.com/photo-1616587226960-4a03badbe8bf?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
      title: "Confrontati con i professionisti",
      description: "Monitora i tuoi risultati e migliora giorno dopo giorno.",
      goTo: "/statistiche",
    },
  ];

  return (
    <section className="py-16 px-6 bg-indigo-50">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-10">
        Scopri cosa puoi fare
      </h2>
      <div className="flex flex-wrap justify-center gap-8">
        {features.map((f, i) => (
          <Card
            key={i}
            image={f.image}
            title={f.title}
            description={f.description}
            goTo={f.goTo}
            isLoggedIn={isLoggedIn}
            onLogin={onLogin}
          />
        ))}
      </div>
    </section>
  );
}
