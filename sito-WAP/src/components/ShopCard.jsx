export default function ShopCard({ title, description = "Descrizione essenziale." }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="h-36 w-full rounded-xl bg-gradient-to-br from-emerald-100 to-lime-100" />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <button className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                Dettagli
            </button>
        </div>
    );
}