// client/src/components/progress/WeightSummary.tsx
import { useMemo } from "react";
import type { WeightPoint } from "../../hooks/useWeightHistory";

export type WeightStats = {
  first: WeightPoint;
  last: WeightPoint;
  diff: number;
  trend: "up" | "down" | "flat";
};

type Props = {
  stats: WeightStats;
  /**
   * Obiettivo della scheda / del percorso.
   * Esempi: "perdita_peso", "aumento_peso", "mantenimento", ecc.
   * Usato solo per personalizzare il messaggio motivazionale.
   */
  goalLabel?: string;
  /**
   * Altezza dell'utente in centimetri (es. 175).
   * Usata per il calcolo dell'IMC e della fascia di normopeso.
   */
  heightCm?: number | null;
};

type BmiCategory = "underweight" | "normal" | "overweight" | "obese" | "unknown";
type NormalizedGoal = "lose" | "gain" | "maintain" | "unknown";

function normalizeGoal(goalLabel?: string): NormalizedGoal {
  if (!goalLabel) return "unknown";
  const g = goalLabel.toLowerCase();

  // perdita peso
  if (g.includes("perd") || g.includes("dimag") || g.includes("cut") || g.includes("defin")) {
    return "lose";
  }
  // aumento peso / massa
  if (
    g.includes("massa") ||
    g.includes("bulk") ||
    g.includes("aumento") ||
    g.includes("aumento_peso") ||
    g.includes("forza") ||
    g.includes("ipertro")
  ) {
    return "gain";
  }
  // mantenimento
  if (g.includes("mant") || g.includes("manten") || g.includes("maint")) {
    return "maintain";
  }

  return "unknown";
}

function getBmiCategory(bmi: number | null): BmiCategory {
  if (bmi == null || !Number.isFinite(bmi)) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function WeightSummary({ stats, goalLabel, heightCm }: Props) {
  const { first, last, diff, trend } = stats;

  const heightMeters =
    typeof heightCm === "number" && heightCm > 0 ? heightCm / 100 : null;

  const bmi = useMemo(() => {
    if (!heightMeters) return null;
    return last.weight / (heightMeters * heightMeters);
  }, [last.weight, heightMeters]);

  const bmiCategory = getBmiCategory(bmi);
  const normalizedGoal = normalizeGoal(goalLabel);

  const trendLabel = useMemo(() => {
    if (trend === "up") return "Aumento di peso";
    if (trend === "down") return "Diminuzione di peso";
    return "Peso stabile";
  }, [trend]);

  const diffLabel = useMemo(() => {
    const value = Math.abs(diff).toFixed(1);
    if (!value || value === "0.0") return "0.0 kg";
    return `${value} kg`;
  }, [diff]);

  const bmiLabel = useMemo(() => {
    if (bmi == null) return null;

    const rounded = bmi.toFixed(1);
    switch (bmiCategory) {
      case "underweight":
        return `IMC ${rounded} (sottopeso)`;
      case "normal":
        return `IMC ${rounded} (normopeso)`;
      case "overweight":
        return `IMC ${rounded} (sovrappeso)`;
      case "obese":
        return `IMC ${rounded} (obesità)`;
      default:
        return `IMC ${rounded}`;
    }
  }, [bmi, bmiCategory]);

  const motivationalText = useMemo(() => {
    const hasAnthro = !!heightMeters && bmi != null;

    // 🔒 1) Peso estremamente basso (warning forte, indipendente da obiettivo)
    if (last.weight < 40) {
      return (
        <>
          Il tuo peso attuale è{" "}
          <span className="font-semibold">{last.weight.toFixed(1)} kg</span>, un valore
          estremamente basso per un adulto. È importante parlarne con un professionista
          per assicurarti che il percorso sia sicuro per la tua salute.
        </>
      );
    }

    // 🔒 2) IMC severo < 16
    if (bmi != null && bmi < 16) {
      return (
        <>
          Il tuo <span className="font-semibold">IMC attuale è {bmi.toFixed(1)}</span>,
          che rientra nella categoria di{" "}
          <span className="font-semibold">sottopeso severo</span>. Questo valore può
          comportare rischi per la salute: confrontarti con un professionista può aiutarti
          a valutare un percorso più sicuro.
        </>
      );
    }

    // 🔒 3) Peso basso + IMC sotto il normopeso
    if (hasAnthro && last.weight < 50 && bmi! < 18.5) {
      return (
        <>
          Il tuo peso (<span className="font-semibold">{last.weight.toFixed(1)} kg</span>)
          e il tuo{" "}
          <span className="font-semibold">IMC ({bmi!.toFixed(1)})</span> indicano una
          condizione di sottopeso. È una situazione che merita attenzione: valuta di
          confrontarti con un professionista per assicurarti che il percorso sia
          equilibrato per te.
        </>
      );
    }

    // 🔒 4) IMC basso ma non critico (16–18.4)
    if (bmi != null && bmi < 18.5) {
      return (
        <>
          Il tuo <span className="font-semibold">IMC è {bmi.toFixed(1)}</span>, che indica
          una condizione di sottopeso. Se il tuo obiettivo è il dimagrimento, fai attenzione
          a non spingere troppo la perdita di peso. Se invece punti alla massa muscolare,
          un apporto calorico adeguato e un buon recupero possono aiutarti a progredire in
          modo più equilibrato.
        </>
      );
    }

    // 🔁 Fallback generico se non abbiamo altezza / obiettivo / BMI
    if (!heightMeters || normalizedGoal === "unknown" || bmi == null) {
      if (trend === "flat") {
        return (
          <>
            Dalla prima misurazione alla più recente il tuo peso è cambiato di{" "}
            <span className="font-semibold">{diffLabel}</span>. Peso stabile: ottimo per
            monitorare nel tempo come allenamento e alimentazione influenzano il tuo
            andamento.
          </>
        );
      }

      const genericIsBetter = trend === "down";
      return (
        <>
          Dalla prima misurazione alla più recente il tuo peso è cambiato di{" "}
          <span className="font-semibold">{diffLabel}</span>.{" "}
          {genericIsBetter
            ? "Stai andando nella direzione giusta rispetto al peso iniziale: continua a monitorare i progressi e come ti senti."
            : "Osserva l’andamento nel tempo e valuta, anche con un professionista, se è il caso di rivedere alcune abitudini."}
        </>
      );
    }

    // Da qui in poi: abbiamo IMC + obiettivo interpretato
    const significantChange = Math.abs(diff) >= 0.5;

    // 🎯 Obiettivo: perdita di peso
    if (normalizedGoal === "lose") {
      if (trend === "down" && significantChange) {
        if (bmiCategory === "normal") {
          return (
            <>
              Hai perso{" "}
              <span className="font-semibold">{diffLabel}</span> rispetto alla prima
              misurazione e il tuo{" "}
              <span className="font-semibold">IMC è in un range salutare</span>. Il
              percorso sta andando nella direzione giusta: continua a monitorare i
              progressi e le sensazioni durante la giornata e in allenamento.
            </>
          );
        }
        if (bmiCategory === "overweight" || bmiCategory === "obese") {
          return (
            <>
              Hai perso{" "}
              <span className="font-semibold">{diffLabel}</span> rispetto alla prima
              misurazione. Stai procedendo verso il tuo obiettivo di dimagrimento: ottimo
              lavoro, continua così mantenendo un approccio graduale e sostenibile.
            </>
          );
        }
        if (bmiCategory === "underweight") {
          return (
            <>
              Il tuo peso è sceso di{" "}
              <span className="font-semibold">{diffLabel}</span>, ma il tuo IMC è già in
              zona sottopeso. Può essere utile confrontarti con un professionista per
              capire se è il caso di stabilizzare o ribilanciare il percorso.
            </>
          );
        }
      }

      if (trend === "up" && significantChange) {
        return (
          <>
            Il tuo peso è aumentato di{" "}
            <span className="font-semibold">{diffLabel}</span> rispetto alla prima
            misurazione. Se il tuo obiettivo è il dimagrimento, potrebbe essere utile
            rivedere alimentazione, attività fisica e recupero insieme a un
            professionista.
          </>
        );
      }

      return (
        <>
          Le variazioni di peso sono contenute (
          <span className="font-semibold">{diffLabel}</span> dalla prima misurazione). Nel
          dimagrimento è normale avere piccoli alti e bassi: osserva la tendenza nel
          tempo più che il singolo valore.
        </>
      );
    }

    // 💪 Obiettivo: aumento massa/peso
    if (normalizedGoal === "gain") {
      if (trend === "up" && significantChange) {
        if (bmiCategory === "normal" || bmiCategory === "underweight") {
          return (
            <>
              Hai aumentato il tuo peso di{" "}
              <span className="font-semibold">{diffLabel}</span>. Per un percorso di
              incremento massa è un segnale coerente: abbina sempre allenamento
              strutturato e buon recupero per trasformare questo aumento in progressi
              qualitativi.
            </>
          );
        }
        if (bmiCategory === "overweight" || bmiCategory === "obese") {
          return (
            <>
              Il tuo peso è aumentato di{" "}
              <span className="font-semibold">{diffLabel}</span>, ma l’IMC è già in un
              range elevato. Se il focus è la massa muscolare, può essere utile
              concentrarsi sulla qualità dei carichi e bilanciare con attenzione apporto
              calorico e composizione corporea.
            </>
          );
        }
      }

      if (trend === "down" && significantChange) {
        return (
          <>
            Il peso è sceso di{" "}
            <span className="font-semibold">{diffLabel}</span> rispetto all’inizio. Con un
            obiettivo di aumento massa potrebbe essere utile aggiustare apporto calorico,
            distribuzione dei pasti e tempi di recupero tra gli allenamenti.
          </>
        );
      }

      return (
        <>
          Le variazioni di peso sono contenute (
          <span className="font-semibold">{diffLabel}</span> dalla prima misurazione). Per
          un obiettivo di massa muscolare è importante osservare anche i carichi che
          gestisci in allenamento, non solo il numero sulla bilancia.
        </>
      );
    }

    // ⚖️ Obiettivo: mantenimento
    if (normalizedGoal === "maintain") {
      if (!significantChange || trend === "flat") {
        return (
          <>
            Il tuo peso è cambiato di{" "}
            <span className="font-semibold">{diffLabel}</span> rispetto alla prima
            misurazione. Per un obiettivo di mantenimento questo livello di stabilità è
            positivo: continui a muoverti in un range coerente.
          </>
        );
      }

      if (trend === "up") {
        return (
          <>
            Il peso è aumentato di{" "}
            <span className="font-semibold">{diffLabel}</span>. Con un obiettivo di
            mantenimento può valere la pena monitorare qualche settimana in più per
            capire se si tratta di una variazione momentanea o di una tendenza
            crescente.
          </>
        );
      }

      if (trend === "down") {
        return (
          <>
            Il peso è diminuito di{" "}
            <span className="font-semibold">{diffLabel}</span>. Anche nel mantenimento un
            po’ di flessibilità è normale, ma se la tendenza prosegue potrebbe essere
            utile rivedere leggermente alimentazione e carico di allenamento.
          </>
        );
      }
    }

    // 🧷 Fallback finale
    return (
      <>
        Dalla prima misurazione alla più recente il tuo peso è cambiato di{" "}
        <span className="font-semibold">{diffLabel}</span>. Continua a monitorare i dati
        nel tempo e a confrontarli con come ti senti nella quotidianità e in allenamento.
      </>
    );
  }, [bmi, bmiCategory, diff, diffLabel, heightMeters, last.weight, normalizedGoal, trend]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2 text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
          Riepilogo peso
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {trendLabel}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {motivationalText}
        </p>

        {bmiLabel && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Il tuo <span className="font-semibold">IMC (Indice di Massa Corporea)</span>{" "}
            attuale è: {bmiLabel}.
          </p>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">Prima misurazione</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              {first.weight.toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(first.measured_at).toLocaleDateString("it-IT")}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ultima misurazione</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              {last.weight.toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(last.measured_at).toLocaleDateString("it-IT")}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">Differenza totale</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
              {diff > 0 ? "+" : ""}
              {diff.toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              rispetto alla prima misurazione
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
