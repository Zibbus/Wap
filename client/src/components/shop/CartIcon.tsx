import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  count: number;
}

export default function CartIcon({ count }: CartIconProps) {
  return (
    <div className="relative inline-block cursor-pointer">
      <ShoppingCart className="w-7 h-7 text-indigo-600 hover:text-indigo-700 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
          {count}
        </span>
      )}
    </div>
  );
}
