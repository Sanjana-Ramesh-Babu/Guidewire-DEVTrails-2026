// Zone risk index — derived from flood/heat history (your README, Model 1)
export const ZONE_RISK = {
  'Koramangala': 1.18,   // flood-prone, dense traffic
  'HSR Layout':  1.08,
  'Whitefield':  0.92,   // historically drier
  'Indiranagar': 1.00,
  'Andheri':     1.12,
  'Anna Nagar':  1.05,
  'Connaught Place': 1.10,
};

// Tier config — matches your README Table exactly
export const TIERS = {
  starter:  { label: 'Starter',     premium: 59,  cap: 700,  coverage: 0.50 },
  casual:   { label: 'Casual',      premium: 79,  cap: 900,  coverage: 0.70 },
  fulltime: { label: 'Full-time',   premium: 129, cap: 1800, coverage: 0.70 },
  power:    { label: 'Power Rider', premium: 199, cap: 3000, coverage: 0.70 },
};

// Tier assignment — LightGBM placeholder (Phase 3), rule-based for Phase 2
export function assignTier(weeklyHours, monthlyEarnings, tenureWeeks) {
  if (weeklyHours >= 60 && monthlyEarnings >= 25000) return 'power';
  if (weeklyHours >= 40 && monthlyEarnings >= 15000) return 'fulltime';
  if (weeklyHours >= 20 && monthlyEarnings >= 8000)  return 'casual';
  return 'starter';
}

// Dynamic premium — zone risk + tenure discount (your README Model 1)
export function calculatePremium(tier, zone, tenureWeeks = 1) {
  const base = TIERS[tier].premium;
  const zoneMultiplier = ZONE_RISK[zone] ?? 1.0;
  const tenureDiscount = Math.min(tenureWeeks * 0.004, 0.12); // max 12% off
  return Math.round(base * zoneMultiplier * (1 - tenureDiscount));
};

// ISS engine — your README Section 5 formula
export function calculateISS(baselineIncome, actualIncome, tier, activeTriggerCount) {
  const coverage = TIERS[tier].coverage;
  const multiplier = triggerStackMultiplier(activeTriggerCount);
  const loss = Math.max(baselineIncome - actualIncome, 0);
  const payout = Math.round(loss * coverage * multiplier);
  const cap = TIERS[tier].cap;
  return {
    payout: Math.min(payout, cap),
    breakdown: { baselineIncome, actualIncome, coverage, multiplier, loss }
  };
}

// Stacking multiplier — your README Section 4 table
export function triggerStackMultiplier(count) {
  if (count >= 3) return 2.0;
  if (count === 2) return 1.4;
  return 1.0;
}

// Cold start baseline — your README Section 3
export function getBaseline(rider, zoneCommunityP40 = 650) {
  if (!rider.tenureWeeks || rider.tenureWeeks < 2)  
    return { value: zoneCommunityP40, source: 'zone_community' };
  if (rider.tenureWeeks < 7) {
    const blend = (rider.avgEarningsPer4hr * 0.4) + (zoneCommunityP40 * 0.6);
    return { value: Math.round(blend), source: 'blended' };
  }
  return { value: rider.avgEarningsPer4hr ?? 800, source: 'personal' };
}

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY; // free tier

// T1 — Real OpenWeatherMap call
async function checkT1_Weather(city = 'Bengaluru') {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWM_KEY}`
    );
    const d = await res.json();
    const rainMm = d.rain?.['1h'] ?? 0;
    const tempC  = (d.main?.temp ?? 303) - 273.15;
    const aqi    = 0; // AQICN call optional
    const fired  = rainMm > 15 || tempC > 40;
    const severity = rainMm > 40 ? 2.0 : rainMm > 15 ? 1.4 : 1.0;
    return { id:'T1', name:'Extreme weather', fired, severity,
             detail: `Rain: ${rainMm}mm, Temp: ${tempC.toFixed(1)}°C`, source:'OpenWeatherMap' };
  } catch {
    return { id:'T1', name:'Extreme weather', fired:false, severity:1.0, detail:'API unavailable', source:'fallback' };
  }
}

// T7 — Real: ECI dry days hardcoded list (ECI API has no public endpoint)
function checkT7_ElectionDryDay() {
  const DRY_DAYS = ['2026-04-04','2026-04-18','2026-05-02'];
  const today = new Date().toISOString().split('T')[0];
  const fired = DRY_DAYS.includes(today);
  return { id:'T7', name:'Election / dry day', fired, severity: fired ? 1.8 : 1.0,
           detail: fired ? 'ECI declared dry day' : 'No restriction today', source:'ECI feed (mocked)' };
}

// T5 — Mock: curfew/strike (simulates civic events)
function checkT5_Curfew(zone) {
  // For demo: always false unless you manually flip this
  const ACTIVE_CURFEW_ZONES = []; // add 'Koramangala' here to demo
  const fired = ACTIVE_CURFEW_ZONES.includes(zone);
  return { id:'T5', name:'Civic curfew / strike', fired, severity: fired ? 1.8 : 1.0,
           detail: fired ? `Zone closure active: ${zone}` : 'No curfew reported', source:'Civic API (mock)' };
}

// T12 — Mock: platform demand collapse
function checkT12_DemandCollapse(zone) {
  // Seeded by zone + hour so it's deterministic for demo, not random
  const hour = new Date().getHours();
  const seed = (zone.length + hour) % 10;
  const dropPct = seed * 6; // 0–54%
  const fired = dropPct > 40;
  return { id:'T12', name:'Peak hour demand collapse', fired, severity: fired ? 1.3 : 1.0,
           detail: `Order velocity: ${100-dropPct}% of normal`, source:'Platform API (mock)' };
}

// T11 — Mock: LPG cascade (restaurant closure density)
function checkT11_LPGCascade(zone) {
  const AFFECTED_ZONES = []; // add zone names here to simulate
  const fired = AFFECTED_ZONES.includes(zone);
  const openDensity = fired ? 45 : 92;
  return { id:'T11', name:'LPG shortage cascade', fired, severity: fired ? 1.5 : 1.0,
           detail: `Restaurant density: ${openDensity}% operational`, source:'Restaurant density API (mock)' };
}

// Master evaluator — runs all 5, returns results + stacking
export async function evaluateTriggers(city, zone) {
  const results = await Promise.all([
    checkT1_Weather(city),
    Promise.resolve(checkT7_ElectionDryDay()),
    Promise.resolve(checkT5_Curfew(zone)),
    Promise.resolve(checkT12_DemandCollapse(zone)),
    Promise.resolve(checkT11_LPGCascade(zone)),
  ]);
  const fired = results.filter(t => t.fired);
  return { triggers: results, firedCount: fired.length, firedIds: fired.map(t => t.id) };
}