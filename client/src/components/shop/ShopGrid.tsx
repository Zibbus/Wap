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

const products: Product[] = [/* ...come prima... */];

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
    () => products.filter(
      (p) => (filter === "tutti" || p.category === filter) && p.name.toLowerCase().includes(search.toLowerCase())
    ),
    [filter, search]
  );

  const addToCart = (p: Product) => { setCart((prev) => [...prev, p]); setDrawerOpen(true); };
  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all z-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mt-10">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden w-full max-w-xs transform hover:scale-[1.02] transition-all duration-300 border border-indigo-100 hover:shadow-lg dark:bg-gray-900 dark:border-gray-800"
          >
            <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }} />
            <div className="p-6 flex flex-col justify-between h-56">
              <div>
                <h3 className="text-lg font-bold text-indigo-700 mb-1 dark:text-indigo-300">{p.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 dark:text-gray-300">{p.description}</p>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-indigo-600 font-extrabold text-lg dark:text-indigo-300">€{p.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  <ShoppingCart className="w-4 h-4" /> Aggiungi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-white to-indigo-50 shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-indigo-100 dark:border-gray-800">
          <h2 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300">Carrello</h2>
          <button onClick={() => setDrawerOpen(false)} className="hover:scale-110 transition-transform">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-5 flex flex-col h-[calc(100%-120px)] overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10 dark:text-gray-300">Il carrello è vuoto.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-2 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">€{item.price.toFixed(2)}</p>
                </div>
                <button onClick={() => remove(item.id)} className="text-red-500 hover:text-red-700 text-sm transition-colors">
                  Rimuovi
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-indigo-100 p-5 flex flex-col gap-3 bg-white/70 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/70">
          <div className="flex justify-between font-semibold text-gray-700 dark:text-gray-200">
            <span>Totale:</span>
            <span className="text-indigo-700 dark:text-indigo-300">€{total.toFixed(2)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              cart.length === 0
                ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-400"
            }`}
          >
            Procedi al pagamento
          </button>
        </div>
      </div>
    </>
  );
}
