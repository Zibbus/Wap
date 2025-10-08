import { useNavigate } from "react-router-dom";

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

  const handleClick = () => {
    if (!isLoggedIn) onLogin();
    else navigate(goTo);
  };

  return (
    <article className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transform transition-all duration-200 w-80 flex flex-col justify-between cursor-pointer">
      <div>
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded-lg mb-4 shadow-sm"
        />
        <h3 className="font-bold text-lg text-indigo-700 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Pulsante “Vai” coerente con header */}
      <button
        onClick={handleClick}
        className="mt-6 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 hover:scale-105 transform transition-all duration-200 shadow-sm cursor-pointer"
      >
        Vai
      </button>
    </article>
  );
}
