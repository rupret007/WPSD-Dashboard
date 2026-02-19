import { Router } from "express";
import { readMMDVMConfig, writeMMDVMConfig } from "../config/mmdvmIniManager";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const config = readMMDVMConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
  }
});

router.put("/", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const existing = readMMDVMConfig();
    const merged: Record<string, Record<string, string | number | boolean>> = {};
    for (const [section, entries] of Object.entries(existing)) {
      if (entries && typeof entries === "object") {
        merged[section] = { ...entries };
      }
    }
    for (const [section, entries] of Object.entries(body)) {
      if (entries && typeof entries === "object" && !Array.isArray(entries)) {
        merged[section] = merged[section] ?? {};
        for (const [k, v] of Object.entries(entries)) {
          if (v !== undefined) {
            merged[section][k] = v as string | number | boolean;
          }
        }
      }
    }
    writeMMDVMConfig(merged);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
  }
});

export default router;
