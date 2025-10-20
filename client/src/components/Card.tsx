import { useNavigate } from "react-router-dom";
import { useRef } from "react";

interface CardProps {
  image: string;
  title: string;
  description: string;
  isLoggedIn: boolean;
  onLogin: () => void;
  goTo: string;
}

export default function Card({
  image,
  title,
  description,
  isLoggedIn,
  onLogin,
  goTo,
}: CardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y - rect.height / 2) / 20) * -1;
    const rotateY = (x - rect.width / 2) / 20;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
      card.style.transition = "transform 0.4s ease";
      setTimeout(() => (card.style.transition = ""), 400);
    }
  };

  const handleClick = () => {
    if (!isLoggedIn) onLogin();
    else navigate(goTo);
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="
        bg-white border border-indigo-100 rounded-2xl p-6 shadow-md 
        hover:shadow-2xl transform transition-transform duration-300 
        w-96 min-h-[480px] flex flex-col justify-between cursor-pointer
        [transform-style:preserve-3d]
      "
      style={{ perspective: "1000px" }}
    >
      <div className="flex flex-col flex-grow">
        {/* Immagine */}
        <img
          src={image}
          alt={title}
          className="w-full h-56 object-cover rounded-xl mb-5 shadow-sm"
        />

        {/* Titolo */}
        <h3 className="font-bold text-xl text-indigo-700 mb-3 leading-snug min-h-[56px] flex items-center">
          {title}
        </h3>

        {/* Descrizione */}
        <p className="text-gray-600 text-base leading-relaxed flex-grow">
          {description}
        </p>
      </div>

      {/* Pulsante “Vai” */}
      <div className="mt-8">
        <button
          onClick={handleClick}
          className="
            w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold 
            hover:bg-indigo-700 hover:scale-105 transform transition-all duration-300 shadow-md
          "
        >
          Vai
        </button>
      </div>
    </article>
  );
}