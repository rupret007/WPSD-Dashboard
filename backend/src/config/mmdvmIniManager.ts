import fs from "fs";
import path from "path";
import { getConfig } from "../config";
import type { MMDVMHostConfig } from "../../../shared/types/mmdvm";

function getMmdvmIniPath(): string {
  const cfg = getConfig();
  return cfg.paths?.mmdvmIni ?? "/etc/mmdvmhost";
}

function parseIni(content: string): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {};
  let current = "";

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) continue;

    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      sections[current] = sections[current] ?? {};
      continue;
    }

    const kv = trimmed.match(/^([^=]+)=(.*)$/);
    if (kv && current) {
      const key = kv[1].trim();
      const val = kv[2].trim();
      sections[current][key] = val;
    }
  }
  return sections;
}

function stringifyIni(sections: Record<string, Record<string, string | number | boolean>>): string {
  const lines: string[] = [];
  for (const [section, entries] of Object.entries(sections)) {
    lines.push(`[${section}]`);
    for (const [k, v] of Object.entries(entries)) {
      lines.push(`${k}=${String(v)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function coerceValue(val: string): string | number | boolean {
  const lower = val.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  const num = parseFloat(val);
  if (!Number.isNaN(num) && String(num) === val) return num;
  return val;
}

export function readMMDVMConfig(): MMDVMHostConfig {
  const iniPath = getMmdvmIniPath();
  let content = "";
  try {
    content = fs.readFileSync(iniPath, "utf8");
  } catch (err) {
    throw new Error(`Cannot read ${iniPath}: ${(err as Error).message}`);
  }

  const raw = parseIni(content);
  const result: MMDVMHostConfig = {};
  for (const [section, entries] of Object.entries(raw)) {
    const obj: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(entries)) {
      obj[k] = coerceValue(v);
    }
    result[section] = obj;
  }
  return result;
}

export function writeMMDVMConfig(config: Record<string, unknown>): void {
  const iniPath = getMmdvmIniPath();
  const sections: Record<string, Record<string, string | number | boolean>> = {};
  for (const [section, entries] of Object.entries(config)) {
    if (entries && typeof entries === "object" && !Array.isArray(entries)) {
      sections[section] = {};
      for (const [k, v] of Object.entries(entries)) {
        if (v !== undefined) sections[section][k] = v as string | number | boolean;
      }
    }
  }
  const content = stringifyIni(sections);
  try {
    fs.writeFileSync(iniPath, content, "utf8");
  } catch (err) {
    throw new Error(`Cannot write ${iniPath}: ${(err as Error).message}`);
  }
}
