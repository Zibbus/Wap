export default function Section({ id, title, children, muted = false }) {
    return (
        <section id={id} className={muted ? "bg-gray-50/70 py-16" : "py-16"}>
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                {title && <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>}
                <div className={title ? "mt-3" : ""}>{children}</div>
            </div>
        </section>
    );
}