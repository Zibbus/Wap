import type { Professional } from "../../types/professional";
import Card from "./Card";

type Props = {
  items: Professional[];
  onOpen: (id: number) => void;     // profilo
  onContact: (id: number) => void;  // contatta
};

export default function List({ items, onOpen, onContact }: Props) {
  if (!items.length) {
    return (
      <section
        className="mt-8"
        aria-labelledby="empty-state-title"
        aria-live="polite"
      >
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-10 text-center">
          <div className="mx-auto mb-6 w-40" aria-hidden="true">
            {/* Illustrazione semplice e pulita */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img">
              <title>Illustrazione profilo</title>
              <circle cx="100" cy="100" r="100" fill="#EEF2FF"/>
              <rect x="50" y="63" width="100" height="80" rx="12" fill="#C7D2FE"/>
              <circle cx="85" cy="100" r="10" fill="white"/>
              <circle cx="115" cy="100" r="10" fill="white"/>
              <path d="M80 120 Q100 135 120 120" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          <h3 id="empty-state-title" className="text-xl font-semibold text-gray-800">
            Stiamo cercando professionisti: potresti essere tu il primo!
          </h3>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            Iscriviti come <span className="font-medium">professionista</span> per comparire in questa sezione
            e farti trovare dai clienti.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {items.map((p) => (
        <Card
          key={p.id}
          p={p}
          onOpen={() => onOpen(p.id)}
          onContact={() => onContact(p.id)}
        />
      ))}
    </div>
  );
}