import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    image:
      "https:https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1600&q=80",
    title: "Allenati con passione",
    description:
      "Scopri programmi personalizzati e monitora i tuoi progressi giorno dopo giorno.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1600&q=80",
    title: "Trova il tuo coach ideale",
    description:
      "Connettiti con professionisti del fitness certificati e raggiungi i tuoi obiettivi.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1571019613914-85f342c55f87?auto=format&fit=crop&w=1600&q=80",
    title: "Benessere a 360°",
    description:
      "MyFit ti accompagna in un percorso di salute, nutrizione e motivazione.",
  },
];

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePrev = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      setFade(true);
    }, 200);
  };

  const handleNext = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      setFade(true);
    }, 200);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-8 overflow-hidden rounded-2xl shadow-lg">
      {/* Immagine con animazione fade */}
      <div
        className={`w-full h-[420px] bg-center bg-cover transition-opacity duration-700 ease-in-out ${
          fade ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url(${slides[currentIndex].image})`,
        }}
      >
        {/* Overlay testo */}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center text-white px-8">
          <div
            className={`transition-all duration-700 transform ${
              fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 drop-shadow-lg">
              {slides[currentIndex].title}
            </h2>
            <p className="text-base sm:text-lg text-gray-100 max-w-2xl mx-auto">
              {slides[currentIndex].description}
            </p>
          </div>
        </div>
      </div>

      {/* Frecce di navigazione */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-indigo-600 p-2 rounded-full shadow-md transition-all duration-300"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-indigo-600 p-2 rounded-full shadow-md transition-all duration-300"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicatori a pallini con focus centrale */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3">
        {slides.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <div
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-500 ease-in-out cursor-pointer rounded-full ${
                isActive
                  ? "w-4 h-4 bg-white shadow-lg scale-110"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}