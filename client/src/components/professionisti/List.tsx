import type { Professional } from "../../types/professional";
import Card from "./Card";

type Props = {
  items: Professional[];
  onOpen: (id: number) => void;
  onContact: (id: number) => void;
};

export default function List({ items, onOpen, onContact }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {items.map(p => (
        <Card key={p.id} p={p} onOpen={() => onOpen(p.id)} onContact={() => onContact(p.id)} />
      ))}
    </div>
  );
}
