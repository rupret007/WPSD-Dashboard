import type { DigitalVoicePacket } from "../../../shared/types/mmdvm";

/**
 * Parses DMR log lines from MMDVMHost.
 * Examples:
 * - DMR Slot 2, received network voice header from 2501001 to TG 2501
 * - DMR Slot 2, received network end of voice transmission, 6.2 seconds, 5% packet loss, BER: 0.0%
 * - DMR Slot 2, received RF end of voice transmission from K6JM to 9990, 7.6 seconds, BER: 0.0%, RSSI: -43/-43/-43 dBm
 */
export function parseDMR(
  message: string,
  timestamp: string,
  rawLine: string
): DigitalVoicePacket | null {
  const headerMatch = message.match(
    /DMR Slot (\d), received (RF|network) voice header from (\d+|[A-Z0-9/]+) to (?:TG )?(\d+)/i
  );
  if (headerMatch) {
    const [, slotStr, origin, srcOrCallsign, targetId] = headerMatch;
    const timeslot = slotStr === "1" ? (1 as const) : (2 as const);
    const src = parseInt(srcOrCallsign, 10);
    const callsign = Number.isNaN(src) ? srcOrCallsign : String(srcOrCallsign);
    return {
      timestamp,
      mode: "DMR",
      callsign,
      src: Number.isNaN(src) ? undefined : src,
      target: `TG ${targetId}`,
      targetId: parseInt(targetId, 10),
      timeslot,
      origin: origin.toLowerCase() as "RF" | "Network",
      raw: rawLine,
    };
  }

  const networkEndMatch = message.match(
    /DMR Slot (\d), received network end of voice transmission, ([\d.]+) seconds, ([\d]+)% packet loss, BER: ([\d.]+)%/i
  );
  if (networkEndMatch) {
    const [, slotStr, duration, loss, ber] = networkEndMatch;
    const timeslot = slotStr === "1" ? (1 as const) : (2 as const);
    return {
      timestamp,
      mode: "DMR",
      callsign: "",
      target: "",
      duration: parseFloat(duration),
      loss: parseInt(loss, 10),
      ber: parseFloat(ber),
      timeslot,
      origin: "Network",
      raw: rawLine,
    };
  }

  const rfEndMatch = message.match(
    /DMR Slot (\d), received RF end of voice transmission from ([A-Z0-9]+) to (\d+), ([\d.]+) seconds, BER: ([\d.]+)%, RSSI: (-?\d+)(?:\/(-?\d+))?(?:\/(-?\d+))? dBm/i
  );
  if (rfEndMatch) {
    const [, slotStr, callsign, targetId, duration, ber, rssi1, rssi2, rssi3] = rfEndMatch;
    const timeslot = slotStr === "1" ? (1 as const) : (2 as const);
    const rssiVals = [rssi1, rssi2, rssi3].filter(Boolean).map((n) => parseInt(n!, 10));
    const rssi =
      rssiVals.length >= 3
        ? { min: Math.min(...rssiVals), avg: Math.round(rssiVals.reduce((a, b) => a + b, 0) / rssiVals.length), max: Math.max(...rssiVals) }
        : parseInt(rssi1, 10);
    return {
      timestamp,
      mode: "DMR",
      callsign,
      target: targetId,
      targetId: parseInt(targetId, 10),
      timeslot,
      duration: parseFloat(duration),
      ber: parseFloat(ber),
      rssi,
      origin: "RF",
      raw: rawLine,
    };
  }

  const networkRfEndMatch = message.match(
    /DMR Slot (\d), received network end of voice transmission from (\d+) to TG (\d+), ([\d.]+) seconds/i
  );
  if (networkRfEndMatch) {
    const [, slotStr, src, targetId, duration] = networkRfEndMatch;
    const timeslot = slotStr === "1" ? (1 as const) : (2 as const);
    return {
      timestamp,
      mode: "DMR",
      callsign: String(src),
      src: parseInt(src, 10),
      target: `TG ${targetId}`,
      targetId: parseInt(targetId, 10),
      timeslot,
      duration: parseFloat(duration),
      origin: "Network",
      raw: rawLine,
    };
  }

  return null;
}
