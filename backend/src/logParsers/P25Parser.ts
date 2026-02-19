import type { DigitalVoicePacket } from "../../../shared/types/mmdvm";

/**
 * Parses P25 Phase 1 log lines from MMDVMHost.
 */
export function parseP25(
  message: string,
  timestamp: string,
  rawLine: string
): DigitalVoicePacket | null {
  if (!message.includes("P25")) return null;

  const headerMatch = message.match(
    /P25, received (RF|network) (?:voice )?(?:header|transmission)(?: from (\d+))?(?: to (\d+))?/i
  );
  if (headerMatch) {
    const [, origin, callsign, target] = headerMatch;
    return {
      timestamp,
      mode: "P25",
      callsign: callsign || "",
      target: target || "",
      origin: (origin || "Network").toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  const endMatch = message.match(
    /P25, received (RF|network) end of voice transmission(?: from (\d+))?,? ([\d.]+) seconds/i
  );
  if (endMatch) {
    const [, origin, callsign, duration] = endMatch;
    return {
      timestamp,
      mode: "P25",
      callsign: callsign || "",
      target: "",
      duration: parseFloat(duration),
      origin: (origin || "Network").toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  return null;
}
