type Props = {
  title: string;
  description: string;
  /** Preferito: */
  imageUrl?: string;
  /** Alias tollerato per retrocompatibilità: */
  image?: string;
  ctaLabel?: string;
  onClick?: () => void;
};

export default function Card({
  title,
  description,
  imageUrl,
  image,
  ctaLabel = "Vai",
  onClick,
}: Props) {
  const src = imageUrl ?? image;

  return (
    <article
      className="
        bg-white border border-indigo-100 rounded-2xl p-6 shadow-md 
        hover:shadow-2xl transform transition-transform duration-300 
        w-96 min-h-[480px] flex flex-col justify-between cursor-pointer
        [transform-style:preserve-3d]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
        dark:bg-gray-900 dark:border-gray-800
      "
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      role="button"
      aria-label={title}
    >
      {src && (
        <div className="mb-4">
          <img
            src={src}
            alt=""
            className="w-full h-48 object-cover rounded-xl"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-xl text-indigo-700 dark:text-indigo-300 mb-3 leading-snug min-h-[56px] flex items-center">
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed flex-grow">
          {description}
        </p>

        <button
          className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold 
                     hover:bg-indigo-700 hover:scale-105 transform transition-all duration-300 shadow-md
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          onClick={onClick}
          aria-label={ctaLabel}
          type="button"
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}