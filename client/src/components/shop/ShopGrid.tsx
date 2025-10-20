import { ShoppingCart, X } from "lucide-react";
import { useMemo } from "react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "attrezzi" | "integratori" | "accessori";
  image: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Manubri Regolabili 20kg",
    description: "Coppia di manubri regolabili per allenamenti completi a casa.",
    price: 149.99,
    category: "attrezzi",
    image:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "Panca Pieghevole",
    description: "Panca multifunzionale per bilanciere e manubri.",
    price: 189.99,
    category: "attrezzi",
    image:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    name: "Proteine Whey 100%",
    description: "Proteine di alta qualità per il recupero muscolare.",
    price: 39.99,
    category: "integratori",
    image:
      "https://images.unsplash.com/photo-1636718289637-7abde0f7b6f5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    name: "Tappetino Yoga Antiscivolo",
    description: "Perfetto per stretching, yoga e pilates.",
    price: 29.99,
    category: "accessori",
    image:
      "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ShopGrid({
  filter,
  search,
  cart,
  setCart,
  drawerOpen,
  setDrawerOpen,
}: {
  filter: string;
  search: string;
  cart: Product[];
  setCart: React.Dispatch<React.SetStateAction<Product[]>>;
  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "tutti" || p.category === filter) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [filter, search]
  );

  const addToCart = (p: Product) => {
    setCart((prev) => [...prev, p]);
    setDrawerOpen(true);
  };

  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  return (
    <>
      {/* 🛒 Pulsante carrello mobile */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all z-50"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      {/* 🏷️ Griglia prodotti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mt-10">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden w-full max-w-xs transform hover:scale-[1.02] transition-all duration-300 border border-indigo-100 hover:shadow-lg"
          >
            <div
              className="h-56 bg-cover bg-center"
              style={{ backgroundImage: `url(${p.image})` }}
            />
            <div className="p-6 flex flex-col justify-between h-56">
              <div>
                <h3 className="text-lg font-bold text-indigo-700 mb-1">
                  {p.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {p.description}
                </p>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-indigo-600 font-extrabold text-lg">
                  €{p.price.toFixed(2)}
                </span>
                <button
                  onClick={() => addToCart(p)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Aggiungi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🧾 Carrello laterale (Drawer) */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-white to-indigo-50 shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-indigo-100">
          <h2 className="text-xl font-extrabold text-indigo-700">Carrello</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="hover:scale-110 transition-transform"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Contenuto carrello */}
        <div className="p-5 flex flex-col h-[calc(100%-120px)] overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Il carrello è vuoto.
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-2"
              >
                <div>
                  <p className="font-semibold text-indigo-700">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    €{item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Rimuovi
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totale + Azione */}
        <div className="border-t border-indigo-100 p-5 flex flex-col gap-3 bg-white/70 backdrop-blur-sm">
          <div className="flex justify-between font-semibold text-gray-700">
            <span>Totale:</span>
            <span className="text-indigo-700">€{total.toFixed(2)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              cart.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
            }`}
          >
            Procedi al pagamento
          </button>
        </div>
      </div>
    </>
  );
}
