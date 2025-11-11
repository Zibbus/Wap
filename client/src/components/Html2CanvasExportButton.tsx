import { useCallback, useState } from "react";
import html2canvas from "html2canvas";

type Props = {
  getTarget: () => HTMLElement | null;  // funzione che restituisce il nodo DOM da catturare
  filename?: string;                     // nome file PNG
  scale?: number;                        // moltiplicatore di risoluzione (es. 2 = “retina”)
  label?: string;                        // testo del bottone
  className?: string;                    // classi stile bottone
};

// Bottone che esporta in PNG un nodo DOM usando html2canvas
export default function Html2CanvasExportButton({
  getTarget,
  filename = "export.png",
  scale = 2,
  label = "Esporta PNG (compatibile)",
  className,
}: Props) {
  // stato: evita doppio click durante l'export
  const [busy, setBusy] = useState(false);

  // handler export: clona, renderizza e salva PNG
  const handle = useCallback(async () => {
    const node = getTarget();
    if (!node) {
      alert("Elemento da esportare non trovato.");
      return;
    }
    setBusy(true);
    try {
      // dimensioni reali del target (copre anche offscreen/overflow)
      const rect = node.getBoundingClientRect();
      const width = Math.max(node.scrollWidth, Math.ceil(rect.width));
      const height = Math.max(node.scrollHeight, Math.ceil(rect.height));

      // render in canvas con css “safe” e isolamento del target
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: width,
        windowHeight: height,
        width,
        height,
        onclone: (clonedDoc) => {
          // rimuovi stili esterni per evitare incompatibilità (es. OKLCH)
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => el.parentNode?.removeChild(el));
          // inietta stile minimale e font “sicuri”
          const safe = clonedDoc.createElement("style");
          safe.textContent = `
            * { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji !important; }
            body { background: #ffffff !important; color: #111827 !important; }
            img { image-rendering: auto; }
          `;
          clonedDoc.head.appendChild(safe);
          // isola il target (opzionale): mostra solo [data-export-workout]
          const target = clonedDoc.querySelector('[data-export-workout]') as HTMLElement | null;
          if (target) {
            Array.from(clonedDoc.body.children).forEach((child) => {
              if (child !== target && !target.contains(child)) {
                (child as HTMLElement).style.display = "none";
              }
            });
          }
        },
      });

      // download immediato del PNG
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
      alert("Errore export");
    } finally {
      setBusy(false);
    }
  }, [getTarget, filename, scale]);

  // UI bottone (disabilitato durante l'export)
  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={className || "px-3 py-2 border rounded"}
      title="Esporta come immagine"
    >
      {busy ? "Esporto…" : label}
    </button>
  );
}
