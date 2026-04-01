import { useEffect, useRef, useState } from "react";
import { useClinicData } from "./use-clinic-data";

export interface HistoryPoint {
  time: string;
  patients: number;
  waitTime: number;
}

/**
 * Accumulates time-series snapshots from the live polling hook.
 * Keeps the last 30 data points (1 per minute if sampled every ~2s it caps naturally).
 */
export const useClinicHistory = () => {
  const { status, waitTime } = useClinicData();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastSampleTime = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    // Sample at most once every 60 seconds to build a meaningful hourly picture
    if (now - lastSampleTime.current < 60_000) return;
    if (status == null) return;

    lastSampleTime.current = now;

    const point: HistoryPoint = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      patients: status.patient_count,
      waitTime: waitTime ?? 0,
    };

    setHistory((prev) => {
      const next = [...prev, point];
      return next.slice(-30); // keep last 30 samples
    });
  }, [status, waitTime]);

  return history;
};
