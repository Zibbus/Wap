export default function Footer() {
    return (
        <footer className="border-t border-black/5 bg-white/60">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-600 md:flex-row md:px-6">
                <p>© {new Date().getFullYear()} Fit&Fuel — Tutti i diritti riservati</p>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-emerald-600">Privacy</a>
                    <a href="#" className="hover:text-emerald-600">Termini</a>
                </div>
            </div>
        </footer>
    );
}