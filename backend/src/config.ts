import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(__dirname, "../../config.json");
const DEFAULT_CONFIG = {
  wpsd: {
    host: "http://192.168.5.82",
    username: "pi-star",
    password: "raspberry",
  },
  tgif: { dmrId: "3221205" },
  server: { port: 3456, host: "0.0.0.0" },
  paths: {
    logDir: "/var/log/pi-star",
    mmdvmIni: "/etc/mmdvmhost",
  },
};

export interface AppConfig {
  wpsd: { host: string; username: string; password: string };
  tgif: { dmrId: string };
  server: { port: number; host: string };
  paths?: { logDir: string; mmdvmIni: string };
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const out = { ...target };
  for (const k of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[k];
    if (srcVal != null && typeof srcVal === "object" && !Array.isArray(srcVal)) {
      (out as Record<string, unknown>)[k as string] = deepMerge(
        ((target as Record<string, unknown>)[k as string] ?? {}) as object,
        srcVal as object
      );
    } else if (srcVal !== undefined) {
      (out as Record<string, unknown>)[k as string] = srcVal;
    }
  }
  return out;
}

function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return deepMerge(DEFAULT_CONFIG, JSON.parse(raw)) as AppConfig;
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
      return { ...DEFAULT_CONFIG } as AppConfig;
    }
    console.error("Invalid config.json:", e.message);
    process.exit(1);
    return DEFAULT_CONFIG as AppConfig; // unreachable; satisfies return type
  }
}

let config = loadConfig();

export function getConfig(): AppConfig {
  return config;
}

export function reloadConfig(): AppConfig {
  config = loadConfig();
  return config;
}

export function updateWpsdHost(host: string): void {
  const newConfig = {
    ...config,
    wpsd: { ...config.wpsd, host },
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf8");
  config = newConfig;
}
