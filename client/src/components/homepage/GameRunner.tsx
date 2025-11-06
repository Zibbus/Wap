import { useEffect, useRef, useState } from "react";

export default function GameRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const startedRef = useRef(false);
  const runningRef = useRef(false);
  const gameOverRef = useRef(false);
  const jumpingRef = useRef(false);
  const reqIdRef = useRef<number | null>(null);

  const gravity = 0.6;
  const jumpStrength = 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🔹 Sprite
    const runSprite = new Image();
    const jumpSprite = new Image();
    const hurdleSprite = new Image();

    runSprite.src = new URL("../../assets/AtletaCorsa.png", import.meta.url).href;
    jumpSprite.src = new URL("../../assets/AtletaSalto.png", import.meta.url).href;
    hurdleSprite.src = new URL("../../assets/Ostacoli.png", import.meta.url).href;

    const frameW = 128;
    const frameH = 128;
    const drawW = 128;
    const drawH = 128;

    const runFrames = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];

    let currentFrame = 0;
    let frameTimer = 0;
    const frameDelay = 8;

    const PLAYER_X = 100;
    const GROUND_HEIGHT = 20;
    const GROUND_TOP = canvas.height - GROUND_HEIGHT;

    let playerBottom = GROUND_TOP;
    let velocity = 0;
    let frame = 0;
    let speed = 7;
    let obstacles: { x: number; type: "low" | "high" }[] = [];

    const startGame = () => {
      setIsGameOver(false);
      setIsStarted(true);
      startedRef.current = true;
      runningRef.current = true;
      gameOverRef.current = false;
      jumpingRef.current = false;
      setScore(0);
      playerBottom = GROUND_TOP;
      velocity = 0;
      obstacles = [];
      frame = 0;
      speed = 7;
      currentFrame = 0;
      frameTimer = 0;

      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      reqIdRef.current = requestAnimationFrame(update);
    };

    const endGame = () => {
      runningRef.current = false;
      gameOverRef.current = true;
      setIsGameOver(true);
    };

    const jump = () => {
      if (!runningRef.current || gameOverRef.current) return;
      if (!jumpingRef.current) {
        velocity = -jumpStrength;
        jumpingRef.current = true;
        currentFrame = 0;
      }
    };

    const drawAthlete = () => {
      const sprite = jumpingRef.current ? jumpSprite : runSprite;
      const f = !jumpingRef.current ? runFrames[currentFrame] : { x: 0, y: 0 };
      const sx = f.x * frameW;
      const sy = f.y * frameH;
      const cropTop = 5;
      const cropY = sy + cropTop;
      const cropH = frameH - cropTop;
      const destX = PLAYER_X;
      const destY = playerBottom - drawH;
      ctx.drawImage(sprite, sx, cropY, frameW, cropH, destX, destY, drawW, drawH);
      if (!jumpingRef.current) {
        frameTimer++;
        if (frameTimer >= frameDelay) {
          frameTimer = 0;
          currentFrame = (currentFrame + 1) % runFrames.length;
        }
      }
    };

    const drawObstacle = (x: number, type: "low" | "high") => {
      const sx = 0;
      const sy = type === "low" ? 0 : 128;
      const y = GROUND_TOP - 128 + 5;
      ctx.drawImage(hurdleSprite, sx, sy, 128, 128, x, y, 128, 128);
      return {
        x: x + 32,
        y: y + (type === "low" ? 88 : 80),
        width: 60,
        height: 40,
      };
    };

    const update = () => {
      if (!runningRef.current) return;
      frame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#eef2ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(0, GROUND_TOP, canvas.width, GROUND_HEIGHT);

      velocity += gravity;
      playerBottom += velocity;
      if (playerBottom > GROUND_TOP) {
        playerBottom = GROUND_TOP;
        velocity = 0;
        if (jumpingRef.current) {
          jumpingRef.current = false;
          currentFrame = 0;
        }
      }

      drawAthlete();

      if (score > 1500) speed = 10;
      else if (score >= 500 && score <= 1500) speed = 9;

      if (frame % 130 === 0) {
        const type = Math.random() < 0.5 ? "low" : "high";
        obstacles.push({ x: canvas.width, type });
      }

      const newObstacles: { x: number; type: "low" | "high" }[] = [];
      for (const obs of obstacles) {
        obs.x -= speed;
        if (obs.x + 128 > 0) newObstacles.push(obs);
        const box = drawObstacle(obs.x, obs.type);

        const hitX = PLAYER_X + 36;
        const hitW = drawW - 72;
        const hitTop = playerBottom - drawH + 40;
        const hitBottom = playerBottom - 12;

        if (
          hitX < box.x + box.width &&
          hitX + hitW > box.x &&
          hitBottom > box.y &&
          hitTop < box.y + box.height
        ) {
          endGame();
          return;
        }
      }
      obstacles = newObstacles;

      if (frame % 10 === 0 && !gameOverRef.current) setScore((p) => p + 1);
      reqIdRef.current = requestAnimationFrame(update);
    };

    // ✅ Rileva in modo robusto se l'utente sta scrivendo
    const isTypingNow = (): boolean => {
      const ae = (document.activeElement as HTMLElement | null);
      if (!ae) return false;

      // 1) contenteditable o discendenti contenteditable
      if (ae.isContentEditable || ae.closest?.('[contenteditable=""],[contenteditable="true"]')) {
        return true;
      }

      // 2) elementi con ruolo "textbox" (editor custom)
      if (ae.getAttribute?.("role") === "textbox" || ae.closest?.('[role="textbox"]')) {
        return true;
      }

      // 3) input/textarea con tipi testuali
      const tag = ae.tagName?.toLowerCase();
      if (tag === "textarea") return true;
      if (tag === "input") {
        const type = (ae as HTMLInputElement).type?.toLowerCase();
        const textTypes = new Set([
          "text", "search", "email", "url", "tel", "password", "number"
        ]);
        if (textTypes.has(type || "text")) return true;
      }

      return false;
    };

    const handleKey = (e: KeyboardEvent) => {
      // Ignora IME/composizione
      // @ts-ignore - alcune runtime espongono isComposing
      if ((e as any).isComposing) return;

      if (e.code === "Space" || e.key === " ") {
        // ⛔ se l'utente sta scrivendo, NON toccare la spacebar
        if (isTypingNow()) return;

        e.preventDefault(); // serve passive:false
        if (!startedRef.current || gameOverRef.current) startGame();
        else jump();
      }
    };

    window.addEventListener("keydown", handleKey, { passive: false });

    const drawIdle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#eef2ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(0, GROUND_TOP, canvas.width, GROUND_HEIGHT);
    };

    runSprite.onload = drawIdle;

    return () => {
      window.removeEventListener("keydown", handleKey);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-3xl font-extrabold text-indigo-700 mb-2">
        MyFit Reflex Trainer
      </h2>
      <p className="max-w-2xl text-center text-gray-700 mb-6 leading-relaxed">
        Allenati a migliorare i riflessi e la coordinazione saltando gli ostacoli
        al momento giusto. Mantieni i tuoi riflessi pronti!
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="border-2 border-indigo-300 rounded-xl bg-white shadow-md"
        ></canvas>

        {!isStarted && !isGameOver && (
          <div className="absolute inset-0 bg-gray-800/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl text-white text-center">
            <p className="text-lg mb-3 opacity-90">Prova ora!</p>
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { code: "Space" });
                window.dispatchEvent(event);
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105 animate-pulse"
            >
              Clicca per iniziare
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl text-white">
            <h3 className="text-2xl font-semibold mb-3">Game Over</h3>
            <p className="text-lg">Punteggio: {score}</p>
            <p className="text-lg mt-2">Premi Spazio per riprovare!</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-gray-700 text-lg">
        Punteggio: <span className="font-semibold text-indigo-600">{score}</span>
      </p>
    </div>
  );
}
