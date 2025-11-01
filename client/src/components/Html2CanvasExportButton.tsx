import { useCallback, useState } from "react";
import html2canvas from "html2canvas";

type Props = {
  getTarget: () => HTMLElement | null;
  filename?: string;
  scale?: number;
  label?: string;
  className?: string;
};

export default function Html2CanvasExportButton({
  getTarget,
  filename = "export.png",
  scale = 2,
  label = "Esporta PNG (compatibile)",
  className,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handle = useCallback(async () => {
    const node = getTarget();
    if (!node) {
      alert("Elemento da esportare non trovato.");
      return;
    }
    setBusy(true);
    try {
      // Misure reali del nodo (anche se offscreen)
      const rect = node.getBoundingClientRect();
      const width = Math.max(node.scrollWidth, Math.ceil(rect.width));
      const height = Math.max(node.scrollHeight, Math.ceil(rect.height));

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
          // 1) Rimuovi tutti gli stili/link (elimina OKLCH & co. dal clone)
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => el.parentNode?.removeChild(el));

          // 2) Aggiungi un CSS minimale sicuro (facoltativo)
          const safe = clonedDoc.createElement("style");
          safe.textContent = `
            * { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji !important; }
            body { background: #ffffff !important; color: #111827 !important; }
            img { image-rendering: auto; }
          `;
          clonedDoc.head.appendChild(safe);

          // 3) (Facoltativo) Isola il target rispetto al resto del DOM
          // Nascondi tutto tranne il nodo target, evitando overlay casuali
          const target = clonedDoc.querySelector('[data-export-workout]') as HTMLElement | null;
          if (target) {
            // Nasconde altri nodi a livello body
            Array.from(clonedDoc.body.children).forEach((child) => {
              if (child !== target && !target.contains(child)) {
                (child as HTMLElement).style.display = "none";
              }
            });
          }
        },
      });

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
