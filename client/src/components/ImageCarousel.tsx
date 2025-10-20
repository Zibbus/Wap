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
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1920&q=80",
    title: "Allenati con passione",
    description:
      "Scopri programmi personalizzati e monitora i tuoi progressi giorno dopo giorno.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1729371568794-fb9c66ab09cf?ixlib=rb-4.1.0&auto=format&fit=crop&w=1920&q=80",
    title: "Trova il tuo coach ideale",
    description:
      "Connettiti con professionisti del fitness certificati e raggiungi i tuoi obiettivi.",
  },
  {
    image:
      "https://plus.unsplash.com/premium_photo-1680042813126-d2ad016b28e0?auto=format&fit=crop&w=1920&q=80",
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
    <div className="relative w-full max-w-7xl mx-auto mt-6 overflow-hidden rounded-3xl shadow-2xl">
      {/* Immagine con animazione fade */}
      <div
        className={`w-full h-[380px] sm:h-[420px] lg:h-[520px] bg-center bg-cover transition-opacity duration-700 ease-in-out ${
          fade ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url(${slides[currentIndex].image})`,
        }}
      >
        {/* Overlay testo */}
        <div className="absolute inset-0 bg-black/35 flex flex-col justify-center items-center text-center text-white px-6 sm:px-10">
          <div
            className={`transition-all duration-700 transform ${
              fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-lg">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/75 hover:bg-white text-indigo-600 p-3 rounded-full shadow-md transition-all duration-300"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/75 hover:bg-white text-indigo-600 p-3 rounded-full shadow-md transition-all duration-300"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Indicatori a pallini */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3">
        {slides.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <div
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-500 ease-in-out cursor-pointer rounded-full ${
                isActive
                  ? "w-4 h-4 bg-white shadow-lg scale-125"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}