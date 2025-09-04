export default function ContactForm() {
    return (
    <form className="mt-6 grid gap-4 md:grid-cols-2">
        <input
            type="text"
            placeholder="Nome"
            className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
            type="email"
            placeholder="Email"
            className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <textarea
            placeholder="Messaggio"
            className="h-28 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
        />
        <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 md:col-span-2"
        >
            Invia richiesta
        </button>
    </form>
    );
}