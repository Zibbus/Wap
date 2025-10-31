import { ClipboardCheck, Target, Dumbbell } from "lucide-react";

const steps = [
  {
    icon: <ClipboardCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />,
    title: "Registrati",
    description: "Crea il tuo account e imposta le tue informazioni base per iniziare.",
  },
  {
    icon: <Target className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />,
    title: "Imposta i tuoi obiettivi",
    description: "Scegli i tuoi obiettivi e lascia che MyFit crei un piano personalizzato per te.",
  },
  {
    icon: <Dumbbell className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />,
    title: "Allenati e monitora",
    description: "Segui i tuoi progressi con schede dinamiche e feedback costanti.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-6 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 mb-12">
        Come funziona MyFit
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-6xl mx-auto text-center">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex flex-col items-center bg-indigo-50 dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md p-8 transition-transform hover:scale-105"
          >
            <div className="mb-4">{step.icon}</div>
            <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
