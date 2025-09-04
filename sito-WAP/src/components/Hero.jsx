export default function Hero({ bgUrl, eyebrow, title, subtitle, ctaPrimary, ctaSecondary }) {
    return (
    <section id="top" className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
        <div
            className="pointer-events-none absolute inset-0 -z-10 bg-fixed bg-cover bg-center"
            style={{ backgroundImage: `url('${bgUrl}')` }}
            aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/30 to-white/0" />
        <div className="mx-auto mt-20 max-w-3xl px-4 text-center text-white md:mt-28">
            {eyebrow && (
                <span className="inline-block rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            {eyebrow}
                </span>
            )}
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">{title}</h1>
                {subtitle && (
                    <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 md:text-lg">{subtitle}</p>
                )}
                {(ctaPrimary || ctaSecondary) && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                    {ctaPrimary && (
                        <a href={ctaPrimary.href} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600">
                        {ctaPrimary.label}
                </a>
                )}
            {ctaSecondary && (
                <a href={ctaSecondary.href} className="rounded-2xl border border-white/70 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/10">
                {ctaSecondary.label}
                </a>
            )}
        </div>
        )}
        </div>
    </section>
    );
}