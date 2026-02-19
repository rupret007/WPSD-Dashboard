import { Router } from "express";
import { getSystemStats } from "../systemStats/statsReader";
import { getServiceStatus } from "../logParsers/MMDVMLogParser";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const stats = getSystemStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
    return;
  }
});

router.get("/service", (_req, res) => {
  try {
    const status = getServiceStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
    return;
  }
});

export default router;
