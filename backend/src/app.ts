import express from "express";
import cors from "cors";
import liveTrafficRouter from "./routes/liveTraffic";
import systemStatsRouter from "./routes/systemStats";
import mmdvmConfigRouter from "./routes/mmdvmConfig";
import tgifRouter from "./routes/tgif";
import wpsdRouter from "./routes/wpsd";
import configRouter from "./routes/config";
import { initMMDVMLogParser } from "./logParsers/MMDVMLogParser";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "64kb" }));

// Live Traffic (parsed MMDVM logs)
app.use("/api/live-traffic", liveTrafficRouter);

// System stats
app.use("/api/system", systemStatsRouter);

// MMDVM config (mmdvmhost.ini)
app.use("/api/mmdvm-config", mmdvmConfigRouter);

// TGIF proxy (preserved)
app.use("/api/tgif", tgifRouter);

// WPSD proxy (preserved)
app.use("/api/wpsd", wpsdRouter);

// Config (WPSD host, etc.)
app.use("/api/config", configRouter);

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 404 for any unmatched /api/... path
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler: uncaught errors and rejected promises from async routes
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
});

export function startBackend(): express.Application {
  initMMDVMLogParser();
  return app;
}

export default app;
