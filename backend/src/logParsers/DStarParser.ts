import type { DigitalVoicePacket } from "../../../shared/types/mmdvm";

/**
 * Parses D-Star log lines from MMDVMHost.
 * Example: D-Star, received RF end of voice transmission from K6JM/AB1CD
 */
export function parseDStar(
  message: string,
  timestamp: string,
  rawLine: string
): DigitalVoicePacket | null {
  const rfMatch = message.match(
    /D-Star, received (RF|network) (?:end of )?voice transmission(?: header)? from ([A-Z0-9/]+)/i
  );
  if (rfMatch) {
    const [, origin, callsign] = rfMatch;
    return {
      timestamp,
      mode: "D-Star",
      callsign,
      target: "",
      origin: (origin || "RF").toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  const reflectorMatch = message.match(
    /D-Star, (?:received )?(?:RF|network) .* (?:to|reflector) (\w+)/i
  );
  if (reflectorMatch) {
    const [, target] = reflectorMatch;
    return {
      timestamp,
      mode: "D-Star",
      callsign: "",
      target,
      origin: "Network",
      raw: rawLine,
    };
  }

  return null;
}
