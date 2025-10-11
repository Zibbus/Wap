import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { json } from 'express';
import authRouter from './routes/auth.js';
import { router as chatRouter } from './routes/chat.js';
import { attachWs } from './ws.js';
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";

const app = express();

// 🔧 Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// 🔹 API routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

// 🔹 Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// 🔹 HTTP + WebSocket server
const server = http.createServer(app);
attachWs(server);

// ✅ Avvio unico del server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
