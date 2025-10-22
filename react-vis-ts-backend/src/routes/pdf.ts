// src/routes/pdf.ts
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const router = express.Router();

/** Escape basilare per testi in LaTeX */
function latexEscape(s: string = ""): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#%&_$~^])/g, "\\$1")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");
}

/**
 * POST /api/pdf/schedule
 * body: {
 *   creator: string,
 *   logoPath?: string,          // opzionale, percorso locale o assoluto accessibile al server
 *   days: Array<{
 *     number: number,
 *     groups: string[],
 *     exercises: Array<{ nome: string, serie: string|number, ripetizioni: string|number, recupero: string, peso: string }>
 *   }>
 * }
 */
router.post("/schedule", async (req: Request, res: Response) => {
  try {
    const { creator = "", logoPath = "", days = [] } = req.body || {};
    if (!Array.isArray(days)) {
      return res.status(400).json({ error: "Campo 'days' mancante o non valido" });
    }

    // Prepara intestazione (niente fontspec: compiliamo con pdflatex)
    const header = String.raw`
\documentclass[a4paper,12pt]{article}
\usepackage[margin=2cm]{geometry}
\usepackage{lmodern}
\usepackage{xcolor}
\usepackage{tcolorbox}
\usepackage{graphicx}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{xparse}
\usepackage{setspace}
\usepackage{etoolbox}

% --------------------
% Color scheme
% --------------------
\definecolor{mainblue}{HTML}{4F46E5}
\definecolor{pagebg}{HTML}{F5F7FF}
\definecolor{cardframe}{HTML}{D1D5DB}
\definecolor{cardbg}{HTML}{FFFFFF}
\definecolor{mutedtext}{HTML}{6B7280}

% Valori dinamici (li imposti tu via template string)
\def\LogoPath{<SARA’ SOSTITUITO DAL BACKEND>}
\def\CreatorName{<SARA’ SOSTITUITO DAL BACKEND>}

\pagestyle{empty}
\pagecolor{pagebg}

% --------------------
% Day ed Exercise
% --------------------
\NewDocumentEnvironment{Day}{mm}{%
  \vspace{6pt}
  \begin{tcolorbox}[colback=cardbg,colframe=cardframe,arc=4pt,boxrule=0.6pt,left=6pt,right=6pt,top=6pt,bottom=6pt]
    \begin{minipage}[t]{0.75\textwidth}\textbf{#1}\end{minipage}%
    \hfill
    \begin{minipage}[t]{0.22\textwidth}\raggedleft\small\textit{#2}\end{minipage}
    \par\medskip
    \begin{spacing}{1.05}
      \begin{tcolorbox}[colback=white,colframe=cardframe,boxrule=0.5pt,arc=3pt,left=6pt,right=6pt,top=6pt,bottom=6pt]
        \begin{minipage}{\textwidth}
}{%
        \end{minipage}
      \end{tcolorbox}
    \end{spacing}
  \end{tcolorbox}
}

% MOSTRA "Peso:" SOLO SE #5 NON È VUOTO
\NewDocumentCommand{\Exercise}{m m m m m}{%
  \vspace{2pt}
  \textbf{#1}\par
  \vspace{2pt}
  {\small\color{mutedtext}%
    Serie: #2 \quad
    Ripetizioni: #3 \quad
    Recupero: #4%
    \ifstrempty{#5}{}{ \quad Peso: #5}%
  }\par
  \vspace{4pt}
}

% Header con logo in alto a destra e nome sotto
\newcommand{\PrintHeader}{%
  \begin{tcolorbox}[colback=cardbg,colframe=cardframe,boxrule=0.6pt,arc=6pt,left=12pt,right=12pt,top=12pt,bottom=12pt,width=\textwidth]
    \begin{minipage}[t]{0.74\textwidth}
      \centering
      {\Huge\bfseries\textcolor{mainblue}{Anteprima scheda allenamento}}
    \end{minipage}%
    \hfill
    \begin{minipage}[t]{0.24\textwidth}
      \begin{flushright}
        \ifstrempty{\LogoPath}{}{%
          \includegraphics[width=0.9\linewidth]{\LogoPath}\\[4pt]
        }
        {\small \textit{\CreatorName}}
      \end{flushright}
    \end{minipage}
  \end{tcolorbox}
}
`;

    const title = "Anteprima scheda allenamento";

    // Contenuto giorni + esercizi
    const daysBlock = days
      .map((d: any) => {
        const groups = Array.isArray(d.groups) ? d.groups.join(", ") : "";
        const exBlock = Array.isArray(d.exercises) && d.exercises.length
          ? d.exercises
              .map(
                (ex: any) =>
                  String.raw`\Exercise{${latexEscape(ex.nome || "")}}{${latexEscape(String(ex.serie ?? ""))}}{${latexEscape(
                    String(ex.ripetizioni ?? "")
                  )}}{${latexEscape(ex.recupero || "")}}{${latexEscape(ex.peso || "")}}`
              )
              .join("\n")
          : "Nessun esercizio inserito";

        return String.raw`
\begin{Day}{Giorno ${Number(d.number) || 0}}{${latexEscape(groups)}}
${exBlock}
\end{Day}`;
      })
      .join("\n");

    const body = String.raw`
\begin{document}
\PrintHeader{${latexEscape(title)}}{${logoPath ? latexEscape(logoPath) : ""}}{${latexEscape(creator)}}

\vspace{10pt}

\begin{tcolorbox}[
  colback=white,
  colframe=cardframe,
  boxrule=0.6pt,
  arc=6pt,
  left=14pt,
  right=14pt,
  top=12pt,
  bottom=12pt,
  width=\textwidth
]
  \noindent\textbf{Piano settimanale}
  \vspace{6pt}

  ${daysBlock}
\end{tcolorbox}

\end{document}
`;

    const latexTemplate = `${header}\n${body}`;

    // Scrivi file .tex
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const stamp = Date.now();
    const texPath = path.join(tmpDir, `scheda_${stamp}.tex`);
    fs.writeFileSync(texPath, latexTemplate, "utf8");

    // Compila (quote i path per Windows)
    const cmd = `pdflatex -interaction=nonstopmode -halt-on-error -output-directory="${tmpDir}" "${texPath}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("[pdflatex] error:", err?.message);
        console.error("[pdflatex] stderr:\n", stderr);
        // prova a leggere il .log per messaggio più chiaro
        const logPath = texPath.replace(/\.tex$/, ".log");
        if (fs.existsSync(logPath)) {
          const log = fs.readFileSync(logPath, "utf8");
          console.error("[pdflatex] log (partial):\n", log.slice(0, 5000));
        }
        return res.status(500).json({ error: "Errore compilazione LaTeX. Controlla il log sul server." });
      }

      const pdfPath = texPath.replace(".tex", ".pdf");
      if (!fs.existsSync(pdfPath)) {
        return res.status(500).json({ error: "PDF non generato." });
      }

      const pdfBuffer = fs.readFileSync(pdfPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=scheda-allenamento.pdf");
      res.send(pdfBuffer);

      // pulizia file temporanei
      const auxPath = texPath.replace(/\.tex$/, ".aux");
      const logPath = texPath.replace(/\.tex$/, ".log");
      [texPath, pdfPath, auxPath, logPath].forEach((p) => {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
      });
    });
  } catch (e: any) {
    console.error("[/api/pdf/schedule] exception:", e?.message || e);
    res.status(500).json({ error: "Errore generazione PDF" });
  }
});

export default router;
