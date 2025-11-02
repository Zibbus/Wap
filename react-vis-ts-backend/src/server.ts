import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import exercisesRoutes from "./routes/exercises";
import schedulesRoutes from "./routes/schedules";

import meRoutes from "./routes/me";
import foodsRoutes from "./routes/foods";
import professionalsRoutes from "./routes/professionals";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import nutritionRouter from "./routes/nutrition.db";

import { attachWs } from "./ws.js";

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// API
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/schedules", schedulesRoutes);

app.use("/api/me", meRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/professionals", professionalsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/nutrition", nutritionRouter);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
attachWs(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
