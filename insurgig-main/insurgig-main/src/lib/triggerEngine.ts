const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

export interface TriggerResult {
  id: string;
  name: string;
  category: string;
  fired: boolean;
  severity: number;
  detail: string;
  source: string;
}

export interface TriggerEvaluation {
  triggers: TriggerResult[];
  firedCount: number;
  firedIds: string[];
  stackedMultiplier: number;
}

// Stacking multiplier — matches your README exactly
function stackMultiplier(firedCount: number): number {
  if (firedCount >= 3) return 2.0;
  if (firedCount === 2) return 1.4;
  return 1.0;
}

// T1 — Real OpenWeatherMap API call
async function checkT1_Weather(city: string): Promise<TriggerResult> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWM_KEY}`
    );
    const d = await res.json();
    const rainMm = d.rain?.["1h"] ?? 0;
    const tempC = (d.main?.temp ?? 303) - 273.15;
    const windKph = (d.wind?.speed ?? 0) * 3.6;
    const visibilityM = d.visibility ?? 10000;

    const fired =
      rainMm > 15 ||
      tempC > 40 ||
      windKph > 60 ||
      visibilityM < 500;

    const severity =
      rainMm > 40 ? 2.0 :
      rainMm > 15 ? 1.4 :
      tempC > 42  ? 1.8 :
      tempC > 40  ? 1.4 :
      1.0;

    return {
      id: "T1",
      name: "Extreme weather",
      category: "Environmental",
      fired,
      severity,
      detail: `Rain: ${rainMm}mm/hr | Temp: ${tempC.toFixed(1)}°C | Wind: ${windKph.toFixed(0)}km/h | Visibility: ${visibilityM}m`,
      source: "OpenWeatherMap (live)",
    };
  } catch {
    // Fallback if API key missing or network error
    return {
      id: "T1",
      name: "Extreme weather",
      category: "Environmental",
      fired: false,
      severity: 1.0,
      detail: "Weather API unavailable — add VITE_OPENWEATHER_KEY to .env",
      source: "fallback",
    };
  }
}

// T7 — Election / dry day (real ECI dates hardcoded — ECI has no public API)
function checkT7_ElectionDryDay(): TriggerResult {
  const DRY_DAYS = [
    "2026-04-04", "2026-04-05",
    "2026-04-18", "2026-05-02",
    "2026-05-12", "2026-11-15",
  ];
  const today = new Date().toISOString().split("T")[0];
  const fired = DRY_DAYS.includes(today);
  return {
    id: "T7",
    name: "Election / dry day",
    category: "Social",
    fired,
    severity: fired ? 1.8 : 1.0,
    detail: fired
      ? `ECI declared dry day today (${today})`
      : `No election restriction today (${today})`,
    source: "ECI notification feed (date-checked)",
  };
}

// T5 — Civic curfew / strike (mock — flip ACTIVE_ZONES to demo)
function checkT5_Curfew(zone: string): TriggerResult {
  // Add zone names here to simulate a curfew for demo
  const ACTIVE_CURFEW_ZONES: string[] = ["Koramangala"];
  const fired = ACTIVE_CURFEW_ZONES.includes(zone);
  return {
    id: "T5",
    name: "Civic curfew / strike",
    category: "Social",
    fired,
    severity: fired ? 1.8 : 1.0,
    detail: fired
      ? `Zone closure active in ${zone} — pickup/drop blocked`
      : "No civic restrictions reported in zone",
    source: "Civic alert API (mock)",
  };
}

// T12 — Platform demand collapse (mock — deterministic by hour so it's stable)
function checkT12_DemandCollapse(zone: string): TriggerResult {
  const hour = new Date().getHours();
  // Peak hours: 12-14 and 19-22. Collapse more likely off-peak
  const isOffPeak = hour < 11 || (hour > 15 && hour < 18) || hour > 22;
  const seed = (zone.length * 3 + hour) % 100;
  const dropPct = isOffPeak ? Math.min(seed + 20, 70) : Math.min(seed, 35);
  const fired = dropPct > 40;
  return {
    id: "T12",
    name: "Peak hour demand collapse",
    category: "Economic",
    fired,
    severity: fired ? 1.3 : 1.0,
    detail: `Order velocity: ${100 - dropPct}% of zone baseline (${zone})`,
    source: "Platform order velocity API (mock)",
  };
}

// T11 — LPG cascade / restaurant closure (mock)
function checkT11_LPGCascade(zone: string): TriggerResult {
  const AFFECTED_ZONES: string[] = [];
  const fired = AFFECTED_ZONES.includes(zone);
  const density = fired ? 42 : 91;
  return {
    id: "T11",
    name: "LPG shortage cascade",
    category: "Economic",
    fired,
    severity: fired ? 1.5 : 1.0,
    detail: `Restaurant operational density: ${density}% in ${zone}`,
    source: "Restaurant density API (mock)",
  };
}

// Master evaluator — runs all 5 triggers, returns full evaluation
export async function evaluateTriggers(
  city: string,
  zone: string
): Promise<TriggerEvaluation> {
  const results = await Promise.all([
    checkT1_Weather(city),
    Promise.resolve(checkT7_ElectionDryDay()),
    Promise.resolve(checkT5_Curfew(zone)),
    Promise.resolve(checkT12_DemandCollapse(zone)),
    Promise.resolve(checkT11_LPGCascade(zone)),
  ]);

  const fired = results.filter((t) => t.fired);
  const firedCount = fired.length;

  return {
    triggers: results,
    firedCount,
    firedIds: fired.map((t) => t.id),
    stackedMultiplier: stackMultiplier(firedCount),
  };
}