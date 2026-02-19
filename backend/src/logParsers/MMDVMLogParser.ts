import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import type { DigitalVoicePacket, ServiceStatus } from "../../../shared/types/mmdvm";
import { getConfig } from "../config";
import { parseDMR } from "./DMRParser";
import { parseDStar } from "./DStarParser";
import { parseYSF } from "./YSFParser";
import { parseP25 } from "./P25Parser";

const MAX_BUFFER = 500;
const packets: DigitalVoicePacket[] = [];
let lastActivityTime: Date | null = null;

function parseRawLine(line: string): DigitalVoicePacket | null {
  const match = line.match(/^M:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(.+)$/);
  if (!match) return null;
  const [, timestamp, message] = match;
  const isoTime = `${timestamp.replace(" ", "T")}Z`;

  const parsed =
    parseDMR(message, isoTime, line) ??
    parseDStar(message, isoTime, line) ??
    parseYSF(message, isoTime, line) ??
    parseP25(message, isoTime, line);

  if (parsed) {
    lastActivityTime = new Date();
    return parsed;
  }
  return null;
}

function readLogFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const pkt = parseRawLine(line);
      if (pkt) {
        packets.push(pkt);
        if (packets.length > MAX_BUFFER) packets.shift();
      }
    }
  } catch (err) {
    // Log file may not exist yet or be locked
    console.warn("[MMDVMLogParser] Could not read", filePath, (err as Error).message);
  }
}

function getLogDir(): string {
  if (process.env.MMDVM_LOG_DIR) return process.env.MMDVM_LOG_DIR;
  const cfg = getConfig();
  return cfg.paths?.logDir ?? "/var/log/pi-star";
}

function getTodayLogPath(): string {
  const today = new Date().toISOString().slice(0, 10);
  return path.join(getLogDir(), `MMDVM-${today}.log`);
}

function initLogTail(): void {
  const logDir = getLogDir();
  const todayPath = getTodayLogPath();

  if (!fs.existsSync(logDir)) {
    console.warn("[MMDVMLogParser] Log dir does not exist:", logDir);
    console.warn("[MMDVMLogParser] Live traffic from logs will be empty. Set paths.logDir in config.json (or MMDVM_LOG_DIR) to a dir with MMDVM-*.log files, or run this backend on Pi-Star.");
    return;
  }

  if (fs.existsSync(todayPath)) {
    readLogFile(todayPath);
  }

  const watcher = chokidar.watch(path.join(logDir, "MMDVM-*.log"), {
    persistent: true,
    ignoreInitial: false,
  });

  watcher.on("add", (p: string) => readLogFile(p));
  watcher.on("change", (p: string) => readLogFile(p));
}

export function initMMDVMLogParser(): void {
  initLogTail();
}

export function getLiveTraffic(limit = 50): DigitalVoicePacket[] {
  const slice = packets.slice(-limit).reverse();
  return slice;
}

export function getServiceStatus(): ServiceStatus {
  const status: ServiceStatus = {
    mmdvmHost: "unknown",
  };
  if (lastActivityTime) {
    status.lastActivity = lastActivityTime.toISOString();
    const ageSeconds = (Date.now() - lastActivityTime.getTime()) / 1000;
    status.mmdvmHost = ageSeconds < 300 ? "running" : "stopped";
  }
  const logDir = getLogDir();
  if (!fs.existsSync(logDir)) {
    status.mmdvmHost = "unknown";
    status.errorMessage = `Log dir not found: ${logDir}`;
  }
  return status;
}
