import type { DigitalVoicePacket } from "../../../shared/types/mmdvm";

/**
 * Parses YSF (System Fusion) log lines from MMDVMHost.
 * Example: YSF, received network voice header from ...
 */
export function parseYSF(
  message: string,
  timestamp: string,
  rawLine: string
): DigitalVoicePacket | null {
  if (!message.includes("YSF")) return null;

  const headerMatch = message.match(
    /YSF, received (RF|network) (?:voice )?(?:header|transmission)(?: from (\d+|[A-Z0-9]+))?(?: to (\w+))?/i
  );
  if (headerMatch) {
    const [, origin, callsign, target] = headerMatch;
    return {
      timestamp,
      mode: "YSF",
      callsign: callsign || "",
      target: target || "",
      origin: (origin || "Network").toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  const endMatch = message.match(
    /YSF, received (RF|network) end of voice transmission(?: from ([A-Z0-9]+))?,? ([\d.]+) seconds/i
  );
  if (endMatch) {
    const [, origin, callsign, duration] = endMatch;
    return {
      timestamp,
      mode: "YSF",
      callsign: callsign || "",
      target: "",
      duration: parseFloat(duration),
      origin: (origin || "Network").toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  return null;
}
