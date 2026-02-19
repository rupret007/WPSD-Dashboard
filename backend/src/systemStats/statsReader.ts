import fs from "fs";
import os from "os";
import type { SystemStats } from "../../../shared/types/mmdvm";

function readProcFile(path: string, fallback: string): string {
  try {
    return fs.readFileSync(path, "utf8").trim();
  } catch {
    return fallback;
  }
}

function getCpuLoad(): number {
  const cpus = os.cpus();
  if (cpus.length === 0) return 0;
  let total = 0;
  let idle = 0;
  for (const cpu of cpus) {
    const times = cpu.times;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
    idle += times.idle;
  }
  const used = total - idle;
  return Math.round((used / total) * 100);
}

function getCpuTemp(): number {
  // Raspberry Pi: /sys/class/thermal/thermal_zone0/temp (millidegrees)
  const val = readProcFile("/sys/class/thermal/thermal_zone0/temp", "0");
  const millideg = parseInt(val, 10) || 0;
  return Math.round(millideg / 1000);
}

function getDiskUsedPercent(): number {
  try {
    const stat = fs.statfsSync("/");
    const total = stat.blocks * stat.bsize;
    const free = stat.bfree * stat.bsize;
    const used = total - free;
    return Math.round((used / total) * 100);
  } catch {
    return 0;
  }
}

function getMemoryUsedPercent(): number {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.round((used / total) * 100);
}

function getUptimeSeconds(): number {
  return Math.floor(os.uptime());
}

export function getSystemStats(): SystemStats {
  return {
    cpuLoad: getCpuLoad(),
    cpuTemp: getCpuTemp(),
    diskUsedPercent: getDiskUsedPercent(),
    memoryUsedPercent: getMemoryUsedPercent(),
    uptimeSeconds: getUptimeSeconds(),
    timestamp: new Date().toISOString(),
  };
}
