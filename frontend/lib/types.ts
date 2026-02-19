/**
 * Shared types for WPSD Dashboard UI (mirrors shared/types/mmdvm.ts)
 */

export type DigitalVoiceMode = "DMR" | "D-Star" | "YSF" | "P25" | "NXDN";

export interface DigitalVoicePacket {
  timestamp: string;
  mode: DigitalVoiceMode;
  callsign: string;
  src?: number;
  target: string;
  targetId?: number;
  timeslot?: 1 | 2;
  duration?: number;
  ber?: number;
  loss?: number;
  rssi?: number | { min: number; avg: number; max: number };
  origin: "RF" | "Network";
  name?: string;
  raw?: string;
}

export interface SystemStats {
  cpuLoad: number;
  cpuTemp: number;
  diskUsedPercent: number;
  memoryUsedPercent?: number;
  uptimeSeconds?: number;
  timestamp: string;
}

export interface ServiceStatus {
  mmdvmHost: "running" | "stopped" | "unknown";
  lastActivity?: string;
  errorMessage?: string;
}

export interface MMDVMHostConfig {
  general?: {
    callsign: string;
    frequency?: number;
    [key: string]: string | number | boolean | undefined;
  };
  [section: string]: Record<string, string | number | boolean | undefined> | undefined;
}
