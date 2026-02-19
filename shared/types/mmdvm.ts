/**
 * WPSD Dashboard - MMDVM/Digital Voice shared type definitions.
 * Used by both backend (parsers) and frontend (UI).
 */

// Raw log line format: "M: YYYY-MM-DD HH:MM:SS.mmm <message>"
export interface MMDVMRawLogLine {
  level: "M";
  timestamp: string;
  message: string;
}

export type DigitalVoiceMode = "DMR" | "D-Star" | "YSF" | "P25" | "NXDN";

/** Unified interface for all modes consumed by Live Traffic view */
export interface DigitalVoicePacket {
  /** ISO-8601 or epoch ms for sorting */
  timestamp: string;
  /** Transmission protocol */
  mode: DigitalVoiceMode;
  /** Source callsign (e.g. K6JM) or DMR ID as string */
  callsign: string;
  /** Source DMR ID when mode is DMR (numeric) */
  src?: number;
  /** Target: Talkgroup, Reflector, DG-ID, etc. */
  target: string;
  /** Target numeric ID (e.g. TG 4000 → 4000) */
  targetId?: number;
  /** Time Slot for DMR (1 or 2) */
  timeslot?: 1 | 2;
  /** Duration in seconds */
  duration?: number;
  /** Bit Error Rate (0–100%) – RF only */
  ber?: number;
  /** Packet loss (0–100%) – Network only */
  loss?: number;
  /** RSSI in dBm (e.g. -43) – RF only; can be min/avg/max */
  rssi?: number | { min: number; avg: number; max: number };
  /** RF vs Network origin */
  origin: "RF" | "Network";
  /** Human-readable name from DMR ID lookup (optional) */
  name?: string;
  /** Raw log line for debugging */
  raw?: string;
}

export interface DMRParsedPacket extends DigitalVoicePacket {
  mode: "DMR";
  timeslot: 1 | 2;
  src: number;
  targetId: number;
}

export interface DStarParsedPacket extends DigitalVoicePacket {
  mode: "D-Star";
  target: string;
}

export interface YSFParsedPacket extends DigitalVoicePacket {
  mode: "YSF";
  target: string;
}

export interface P25ParsedPacket extends DigitalVoicePacket {
  mode: "P25";
  nac?: number;
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
  [section: string]: Record<string, string | number | boolean> | undefined;
}
