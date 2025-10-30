import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth";
import { router as chatRouter } from "./routes/chat.js";
import exercisesRoutes from "./routes/exercises";
import schedulesRoutes from "./routes/schedules";

import meRoutes from "./routes/me";
import foodsRoutes from "./routes/foods";
import nutritionRouter from "./routes/nutrition.js";

import { attachWs } from "./ws.js";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// API
app.use("/api/chat", chatRouter);
app.use("/api/auth", authRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/schedules", schedulesRoutes);

app.use("/api/me", meRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/nutrition", nutritionRouter);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
attachWs(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
