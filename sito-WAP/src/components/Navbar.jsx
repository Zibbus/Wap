import { useState } from "react";
import { Menu, X } from "lucide-react";


export default function Navbar({ brand = "Fit&Fuel", navItems = [] }) {
    const [open, setOpen] = useState(false);
    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
                <a href="#top" className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-400 shadow-lg" />
                    <span className="text-lg font-semibold tracking-tight">{brand}</span>
                </a>
            <nav className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-600"
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
            <button
                className="inline-flex items-center rounded-xl border border-gray-200 p-2 md:hidden"
                aria-label="Apri menu"
                onClick={() => setOpen((v) => !v)}
            >
                {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            </div>
            {open && (
                <div className="md:hidden">
                    <div className="mx-auto max-w-7xl px-4 pb-3 md:px-6">
                        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                            {navItems.map((item) => (
                                <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}