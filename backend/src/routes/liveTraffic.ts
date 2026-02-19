import { Router } from "express";
import { getLiveTraffic } from "../logParsers/MMDVMLogParser";

const router = Router();

router.get("/", (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
  const packets = getLiveTraffic(limit);
  res.json(packets);
});

export default router;
