import { useEffect, useRef, useState } from "react";

export default function GameRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  const gravity = 0.6;
  const jumpStrength = 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- SPRITES ---
    const athlete = new Image();
    athlete.src = new URL("../assets/athlete_spritesheet.png", import.meta.url).href;

    const frameWidth = 128; // ogni frame nel foglio
    const frameHeight = 128;
    const totalFrames = 6;
    let currentFrame = 0;
    let frameCounter = 0;

    // --- VARIABILI GIOCO ---
    let playerY = canvas.height - 60;
    let velocity = 0;
    let obstacles: { x: number; width: number; height: number }[] = [];
    let frame = 0;
    let running = true;

    const resetGame = () => {
      setScore(0);
      setIsGameOver(false);
      playerY = canvas.height - 60;
      velocity = 0;
      obstacles = [];
      frame = 0;
      running = true;
      requestAnimationFrame(update);
    };

    const jump = () => {
      if (!isJumping && !isGameOver) {
        velocity = -jumpStrength;
        setIsJumping(true);
      } else if (isGameOver) resetGame();
    };

    const drawAthlete = () => {
      const sx = (currentFrame % totalFrames) * frameWidth;
      const sy = 0;

      // disegna frame corrente
      ctx.drawImage(
        athlete,
        sx, sy, frameWidth, frameHeight, // sorgente
        50, playerY - 60, 64, 64         // destinazione (scala più piccola)
      );

      // cambia frame ogni pochi update per effetto animato
      frameCounter++;
      if (frameCounter % 5 === 0) {
        currentFrame = (currentFrame + 1) % totalFrames;
      }
    };

    const update = () => {
      if (!running || !ctx) return;
      frame++;

      // --- SFONDO ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#eef2ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- TERRENO ---
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      // --- FISICA ---
      velocity += gravity;
      playerY += velocity;

      if (playerY > canvas.height - 60) {
        playerY = canvas.height - 60;
        velocity = 0;
        setIsJumping(false);
      }

      // --- DISEGNA ATLETA ---
      drawAthlete();

      // --- OSTACOLI ---
      if (frame % 90 === 0) {
        const height = 40;
        obstacles.push({ x: canvas.width, width: 35, height });
      }

      ctx.fillStyle = "#4f46e5";
      obstacles.forEach((obs) => (obs.x -= 5));
      obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);
      obstacles.forEach((obs) =>
        ctx.fillRect(obs.x, canvas.height - obs.height - 20, obs.width, obs.height)
      );

      // --- COLLISIONE ---
      for (const obs of obstacles) {
        if (
          50 < obs.x + obs.width &&
          50 + 35 > obs.x &&
          playerY + 60 > canvas.height - obs.height - 20
        ) {
          running = false;
          setIsGameOver(true);
          return;
        }
      }

      // --- PUNTEGGIO ---
      if (frame % 10 === 0 && !isGameOver) setScore((prev) => prev + 1);

      if (running) requestAnimationFrame(update);
    };

    // --- EVENTI ---
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") jump();
    };
    const handleClick = () => jump();

    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("click", handleClick);

    requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4">
        🏃 Mini-gioco MyFit: Salta gli ostacoli!
      </h2>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="border-2 border-indigo-300 rounded-xl bg-white shadow-md"
      ></canvas>
      <p className="mt-4 text-gray-700 text-lg">
        Punteggio: <span className="font-semibold text-indigo-600">{score}</span>
      </p>
      {isGameOver && (
        <p className="mt-2 text-red-500 font-semibold">
          💀 Game Over — premi <kbd>Space</kbd> o clicca per riprovare!
        </p>
      )}
    </div>
  );
}
