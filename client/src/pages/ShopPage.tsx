import { usePageTitle } from "../hooks/usePageTitle";

export default function ShopPage() {
  usePageTitle("Shop");

  // Modalità "work in progress"
  const UNDER_CONSTRUCTION = true;

  if (UNDER_CONSTRUCTION) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Illustrazione inline: cono + ingranaggi */}
          <div className="mx-auto mb-6 w-36 h-36">
            <svg viewBox="0 0 256 256" className="w-full h-full">
              {/* cono cantiere */}
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopOpacity="1" />
                  <stop offset="100%" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              <g fill="none" stroke="currentColor" strokeWidth="6">
                <path d="M48 208h160l-20-40H68l-20 40z" fill="hsl(222 14% 90%)" />
                <path d="M88 88h80l16 40H72l16-40z" fill="hsl(43 96% 56%)" />
                <path d="M104 48h48l16 40h-80l16-40z" fill="hsl(43 96% 66%)" />
                <path d="M68 168h120" stroke="hsl(222 10% 60%)" opacity="0.5" />
                {/* strisce */}
                <path d="M92 88l-12 40M128 48l-12 40M164 88l12 40" />
              </g>
              {/* ingranaggio */}
              <g transform="translate(190,60) scale(0.7)">
                <circle cx="0" cy="0" r="22" fill="hsl(222 14% 90%)" stroke="hsl(222 10% 50%)" strokeWidth="5" />
                <g fill="hsl(222 10% 60%)">
                  <rect x="-4" y="-36" width="8" height="12" rx="2" />
                  <rect x="-4" y="24" width="8" height="12" rx="2" />
                  <rect x="-36" y="-4" width="12" height="8" rx="2" />
                  <rect x="24" y="-4" width="12" height="8" rx="2" />
                  <rect x="17" y="-30" width="8" height="12" rx="2" transform="rotate(45 21  -24)" />
                  <rect x="-25" y="18" width="8" height="12" rx="2" transform="rotate(45 -21 24)" />
                  <rect x="-30" y="-25" width="12" height="8" rx="2" transform="rotate(45 -24 -21)" />
                  <rect x="18" y="17" width="12" height="8" rx="2" transform="rotate(45 24 21)" />
                </g>
              </g>
              {/* ombra */}
              <ellipse cx="128" cy="220" rx="88" ry="10" fill="url(#g1)" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Stiamo lavorando per voi
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            La sezione Shop è in costruzione. Torna presto per scoprire prodotti, attrezzi e accessori!
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-300 dark:hover:bg-gray-800">
            🚧 Lavori in corso
          </div>
        </div>
      </div>
    );
  }

  // Mettere qui la UI quando decidiamo di procedere con lo shop
  // (ShopFilters, ShopGrid, ecc.)
  return null;
}
