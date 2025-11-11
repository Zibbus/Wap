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

import { attachWs } from "./ws.js"; // WebSocket helpers

const app = express();

// Middleware base
// CORS_ORIGINS accetta una lista separata da virgola (es: "http://localhost:5173,https://app.mysite.com")
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.use("/api/assistant", assistantRouter);

// API
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
app.get("/health", (_req, res) => res.json({ ok: true }));

// HTTP server + WebSocket
const PORT = Number(process.env.PORT) || 4000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const server = http.createServer(app);
attachWs(server);

server.listen(PORT, () => {
  console.log(`✅ Server running on ${PUBLIC_URL}`);
});

export default server;
