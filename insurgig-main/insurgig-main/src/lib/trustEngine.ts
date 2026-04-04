// src/lib/trustEngine.js
export function calculateTCS(signals) {
  // signals = { gpsPrecision, accelVariance, cellTowerMatch,
  //             platformSessionActive, claimLatencySec, priorClaimsCleared }
  let score = 100;
  const flags = [];

  // Layer 1 — GPS quality (mock: precision 1.0 = suspicious)
  if (signals.gpsPrecision >= 0.95) {
    score -= 25; flags.push('GPS precision suspiciously high for weather conditions');
  }

  // Layer 2 — Accelerometer variance (near-zero = not on a bike)
  if (signals.accelVariance < 0.5) {
    score -= 20; flags.push('Near-zero IMU variance — device likely stationary');
  }

  // Layer 3 — Cell tower zone match
  if (!signals.cellTowerMatch) {
    score -= 25; flags.push('Cell tower location mismatches claimed zone');
  }

  // Layer 5 — Platform session (no session = not working)
  if (!signals.platformSessionActive) {
    score -= 20; flags.push('No active platform session in last 2 hours');
  }

  // Layer 6 — Claim timing (under 90s after trigger = bot-like)
  if (signals.claimLatencySec < 90) {
    score -= 15; flags.push(`Claim submitted ${signals.claimLatencySec}s after trigger fire`);
  }

  // Trust bonus for cleared prior claims
  score += Math.min(signals.priorClaimsCleared * 5, 20);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    routing: score > 75 ? 'auto_approve' : score > 40 ? 'soft_hold' : 'analyst_review',
    flags
  };
}

// Generate mock signals for demo (realistic variation)
export function mockSignals(riderTenureWeeks = 4, isGenuine = true) {
  if (isGenuine) return {
    gpsPrecision: 0.62 + Math.random() * 0.2,   // noisy = outdoor
    accelVariance: 2.1 + Math.random() * 1.5,    // bike vibration
    cellTowerMatch: true,
    platformSessionActive: true,
    claimLatencySec: 180 + Math.random() * 300,  // 3–8 min
    priorClaimsCleared: Math.floor(riderTenureWeeks / 2)
  };
  return {  // fraud signals
    gpsPrecision: 0.99,          // too clean
    accelVariance: 0.02,         // stationary
    cellTowerMatch: false,        // wrong location
    platformSessionActive: false, // not working
    claimLatencySec: 45,         // scripted
    priorClaimsCleared: 0
  };
}
