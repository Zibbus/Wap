import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { json } from 'express';
import { router as authRouter } from './routes/auth.js';
import { router as chatRouter } from './routes/chat.js';
import { attachWs } from './ws.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);

const server = http.createServer(app);
attachWs(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
