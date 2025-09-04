export default function FeatureList({ items = [] }) {
    return (
        <ul className="mt-4 space-y-2 text-gray-700">
            {items.map((i) => (
        <li key={i}>• {i}</li>
            ))}
        </ul>
    );
}