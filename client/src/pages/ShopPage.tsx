import { useState } from "react";
import Header from "../components/Layouts/Header/Header";
import Footer from "../components/Layouts/footer/Footer";
import ShopFilters from "../components/shop/ShopFilters";
import ShopGrid from "../components/shop/ShopGrid";

export default function ShopPage() {
  const [filter, setFilter] = useState<"tutti" | "attrezzi" | "integratori" | "accessori">("tutti");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800 pt-20">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        {/* 🛍️ Hero Section per lo shop */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-indigo-700 mb-4 drop-shadow-sm">
            Shop MyFit
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Scopri i migliori attrezzi, integratori e accessori per portare il tuo allenamento al livello successivo.
          </p>
        </section>

        {/* 🔍 Filtri e barra di ricerca */}
        <ShopFilters
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          products={[]} // solo per compatibilità
        />

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

      <Footer />
    </div>
  );
}
