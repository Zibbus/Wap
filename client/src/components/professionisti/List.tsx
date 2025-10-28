import type { Professional } from "../../types/professional";
import Card from "./Card";

type Props = {
  items: Professional[];
  onOpen: (id: number) => void;
  onContact: (id: number) => void;
};

export default function List({ items, onOpen, onContact }: Props) {
  if (!items.length) {
    return (
      <div className="mt-8">
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-10 text-center">
          <div className="mx-auto mb-6 w-40">
            {/* Illustrazione semplice e pulita */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="100" cy="100" r="96" fill="#EEF2FF"/>
              <rect x="50" y="70" width="100" height="60" rx="12" fill="#C7D2FE"/>
              <circle cx="85" cy="100" r="10" fill="white"/>
              <circle cx="115" cy="100" r="10" fill="white"/>
              <path d="M80 120 Q100 135 120 120" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Stiamo cercando professionisti e potresti essere tu il primo!
          </h3>
          <p className="mt-2 text-gray-600">
            Iscriviti come professionista per comparire in questa sezione e farti trovare dai clienti.
          </p>
        </div>
      </div>
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