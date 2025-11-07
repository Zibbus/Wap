import { useState } from "react";
import ShopFilters from "../components/shop/ShopFilters";
import ShopGrid from "../components/shop/ShopGrid";
import { usePageTitle } from "../hooks/usePageTitle";

export default function ShopPage() {
  usePageTitle("Shop");
  const [filter, setFilter] = useState<"tutti" | "attrezzi" | "integratori" | "accessori">("tutti");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-indigo-50 to-white text-gray-800 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100">
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        {/* 🛍️ Hero Section per lo shop */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4 drop-shadow-sm">
            Shop MyFit
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Scopri i migliori attrezzi, integratori e accessori per portare il tuo allenamento al livello successivo.
          </p>
        </section>

        {/* 🔍 Filtri e barra di ricerca */}
        <div className="rounded-2xl border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <ShopFilters
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            products={[]}
          />
        </div>

        {/* 🏷️ Griglia prodotti + carrello laterale */}
        <div className="mt-12">
          <ShopGrid
            filter={filter}
            search={search}
            cart={cart}
            setCart={setCart}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        </div>
      </main>
    </div>
  );
}
