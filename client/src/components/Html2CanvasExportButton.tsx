import { useCallback, useState } from "react";
import html2canvas from "html2canvas";

type Props = {
  getTarget: () => HTMLElement | null;
  filename?: string;   // es: "piano.png"
  scale?: number;      // 1..3 (default 2)
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
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
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
