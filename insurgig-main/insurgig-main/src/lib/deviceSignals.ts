/**
 * Collect device-side signals for Trust Composite Score (best-effort in browser).
 */
export async function sampleAccelVariance(durationMs = 1200): Promise<number> {
  if (typeof window === "undefined" || !window.DeviceMotionEvent) {
    return 2.0 + Math.random() * 0.4;
  }
  return new Promise((resolve) => {
    const readings: number[] = [];
    const onMotion = (e: DeviceMotionEvent) => {
      const x = e.acceleration?.x ?? 0;
      const y = e.acceleration?.y ?? 0;
      const z = e.acceleration?.z ?? 0;
      readings.push(Math.sqrt(x * x + y * y + z * z));
    };
    window.addEventListener("devicemotion", onMotion);
    window.setTimeout(() => {
      window.removeEventListener("devicemotion", onMotion);
      if (readings.length < 3) {
        resolve(2.0);
        return;
      }
      const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
      const v = readings.reduce((s, r) => s + (r - mean) ** 2, 0) / readings.length;
      resolve(Math.max(0.05, Math.sqrt(v)));
    }, durationMs);
  });
}

export async function collectClaimSignals(triggerFiredAt: Date): Promise<Record<string, unknown>> {
  const accelVariance = await sampleAccelVariance();
  const now = Date.now();
  const claimLatencySec = Math.max(30, (now - triggerFiredAt.getTime()) / 1000);

  let gpsPrecision = 0.72;
  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 });
      });
      const acc = pos.coords.accuracy;
      gpsPrecision = Math.max(0.35, Math.min(0.98, 1 - Math.min(acc, 200) / 220));
    } catch {
      gpsPrecision = 0.65;
    }
  }

  return {
    gps_precision: gpsPrecision,
    accel_variance: accelVariance,
    cell_tower_match_score: 1,
    platform_session_score: 1,
    claim_latency_sec: claimLatencySec,
    mock_location_enabled: false,
  };
}
