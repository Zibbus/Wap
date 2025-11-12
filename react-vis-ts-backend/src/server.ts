// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";

import assistantRouter from "./routes/assistant";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import exercisesRoutes from "./routes/exercises";
import schedulesRoutes from "./routes/schedules";
import nutritionPlansRouter from "./routes/nutritionPlans.js";
import meRoutes from "./routes/me";
import foodsRoutes from "./routes/foods";
import professionalsRoutes from "./routes/professionals";
import customersRouter from "./routes/customers.js";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import nutritionRouter from "./routes/nutrition.db";
import { attachWs } from "./ws.js";

const app = express();

/* ================== CORS ================== */
// CORS_ORIGINS: lista separata da virgole (es: "http://localhost:5173,http://127.0.0.1:5173,https://app.mysite.com")
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...ALLOWED_ORIGINS])];

app.use(cors({
  origin: ORIGINS,
  credentials: true,
}));

app.use(express.json());

/* ================== ROUTES ================== */
app.use("/api/assistant", assistantRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/nutrition/plans", nutritionPlansRouter);
app.use("/api/me", meRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/professionals", professionalsRoutes);
app.use("/api/customers", customersRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/nutrition", nutritionRouter);

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/api/health", (_req, res) => {
  const lowMem = process.env.LOW_MEMORY === "1";
  res.status(200).json({
    ok: true,
    provider: process.env.PROVIDER ?? null,
    model: lowMem ? (process.env.OLLAMA_MODEL_LIGHT ?? null) : (process.env.OLLAMA_MODEL ?? null),
    lowMemory: lowMem,
  });
});

/* ============ HTTP server + WebSocket ============ */
const PORT = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0"; // ascolta su tutte le interfacce
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const server = http.createServer(app);
attachWs(server);

server.listen(PORT, HOST, () => {
  const lowMem = process.env.LOW_MEMORY === "1";
  const model = lowMem ? process.env.OLLAMA_MODEL_LIGHT : process.env.OLLAMA_MODEL;
  console.log("✅ Server running on", PUBLIC_URL);
  console.log("🌐 CORS origins:", ORIGINS.join(", ") || "(none)");
  if (process.env.PROVIDER) console.log("🤖 Provider:", process.env.PROVIDER);
  if (model) console.log("🧠 Model:", model);
});

export default server;
