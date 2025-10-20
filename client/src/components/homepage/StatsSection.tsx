import { useEffect, useState } from "react";
import { Users, Activity, Utensils } from "lucide-react";

const statsData = [
  {
    icon: <Activity className="w-10 h-10 text-indigo-600" />,
    label: "Allenamenti completati",
    value: 12430,
  },
  {
    icon: <Utensils className="w-10 h-10 text-indigo-600" />,
    label: "Piani nutrizionali creati",
    value: 4800,
  },
  {
    icon: <Users className="w-10 h-10 text-indigo-600" />,
    label: "Professionisti registrati",
    value: 2100,
  },
];

export default function StatsSection() {
  const [counts, setCounts] = useState(statsData.map(() => 0));

  useEffect(() => {
    // 🚀 Anima i conteggi a ogni refresh o nuovo montaggio del componente
    const duration = 1200; // durata totale più fluida
    const fps = 60; // fotogrammi al secondo
    const totalFrames = Math.round((duration / 1000) * fps);

    statsData.forEach((stat, index) => {
      let frame = 0;
      const counter = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // easing out cubico
        const currentValue = Math.floor(stat.value * easedProgress);

        setCounts((prev) => {
          const updated = [...prev];
          updated[index] = currentValue;
          return updated;
        });

        if (frame === totalFrames) clearInterval(counter);
      }, 1000 / fps);
    });
  }, []); // ✅ si riattiva a ogni refresh del componente

  return (
    <section className="py-20 flex justify-center items-center px-4">
      {/* 🔹 Contenitore stondato */}
      <div className="relative w-full max-w-6xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden text-white p-12 md:p-20">
        {/* 🔹 Effetto luci decorative */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-x-16 translate-y-16"></div>

        {/* 🔹 Contenuto */}
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-extrabold mb-14 tracking-tight">
            I numeri di <span className="text-white">MyFit</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16">
            {statsData.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-white/15 backdrop-blur-lg rounded-2xl p-10 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 hover:bg-white/25"
              >
                {/* Icona */}
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/30 mb-5 shadow-inner">
                  {stat.icon}
                </div>

                {/* Numero animato */}
                <p className="text-5xl font-extrabold mb-2 drop-shadow-md tracking-tight transition-all duration-200">
                  {counts[i].toLocaleString("it-IT")}
                </p>

                {/* Etichetta */}
                <p className="text-sm text-indigo-100 uppercase font-medium tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
