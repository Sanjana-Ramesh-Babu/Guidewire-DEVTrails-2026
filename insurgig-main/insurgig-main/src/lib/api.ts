/** Use VITE_API_URL for full URL, or default /api (Vite proxy → FastAPI). */
const base = import.meta.env.VITE_API_URL ?? "/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const insurGigApi = {
  catalogZones: () => api<Array<Record<string, unknown>>>("/catalog/zones"),
  catalogTiers: () => api<Record<string, Record<string, unknown>>>("/catalog/tiers"),

  sendOtp: (phone: string) =>
    api<Record<string, unknown>>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) }),

  verifyOtp: (phone: string, code: string) =>
    api<{ token: string; expires_in: number }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),

  riderLoginOtpSend: (phone: string) =>
    api<Record<string, unknown>>("/riders/login/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  riderLoginVerify: (phone: string, code: string) =>
    api<Record<string, unknown>>("/riders/login/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),

  register: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/riders/register", { method: "POST", body: JSON.stringify(body) }),

  getRider: (publicId: string) => api<Record<string, unknown>>(`/riders/${publicId}`),

  onboardingChat: (publicId: string) =>
    api<{ messages: Array<Record<string, unknown>> }>(`/riders/${publicId}/onboarding-chat`),

  payWeekPremium: (publicId: string) =>
    api<{ ok: boolean; already_paid: boolean; amount: number }>(`/riders/${publicId}/pay-week-premium`, {
      method: "POST",
    }),

  dashboard: (publicId: string) => api<Record<string, unknown>>(`/riders/${publicId}/dashboard`),

  premiumHistory: (publicId: string) =>
    api<Array<{ week_start: string; tier_label: string; amount: number; status: string }>>(
      `/riders/${publicId}/premium-history`
    ),

  earnings: (publicId: string) =>
    api<{
      baseline_per_4h: number;
      series: { week: string; value: number }[];
      recovery_pct: number;
      last_disruption: string | null;
    }>(`/riders/${publicId}/earnings`),

  submitClaim: (riderPublicId: string, signals: Record<string, unknown>) =>
    api<Record<string, unknown>>("/claims/submit", {
      method: "POST",
      body: JSON.stringify({ rider_public_id: riderPublicId, signals }),
    }),

  finalizeSoftHold: (claimPublicId: string) =>
    api<{ payout_amount: number; status: string }>(`/claims/${claimPublicId}/finalize-soft-hold`, {
      method: "POST",
    }),

  listClaims: (publicId: string) => api<Record<string, unknown>[]>(`/claims/rider/${publicId}`),

  opsOverview: () => api<Record<string, unknown>>("/ops/overview"),
  opsMeta: () => api<Record<string, unknown>>("/ops/meta"),
  opsRiders: (limit = 500) => api<Record<string, unknown>[]>(`/ops/riders?limit=${limit}`),
  opsRecentPayouts: (limit = 20) =>
    api<Record<string, unknown>[]>(`/ops/payouts/recent?limit=${limit}`),
  opsTriggersStatus: (city?: string) =>
    api<Record<string, unknown>[]>(`/ops/triggers/status${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  opsTriggerAudit: () => api<Record<string, unknown>[]>("/ops/triggers/audit"),
  opsTriggerOverrides: () => api<Record<string, unknown>[]>("/ops/trigger-overrides"),
  opsToggleTrigger: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/ops/triggers/toggle", { method: "POST", body: JSON.stringify(body) }),
  opsFraudRings: () => api<Record<string, unknown>[]>("/ops/fraud-rings"),
  opsResolveRing: (alertPublicId: string) =>
    api<Record<string, unknown>>("/ops/fraud-rings/resolve", {
      method: "POST",
      body: JSON.stringify({ alert_public_id: alertPublicId, resolved: true }),
    }),
  opsAnalystQueue: () => api<Record<string, unknown>[]>("/ops/analyst-queue"),
  opsAnalystAction: (claimPublicId: string, action: "approve" | "reject") =>
    api<Record<string, unknown>>("/ops/analyst/action", {
      method: "POST",
      body: JSON.stringify({ claim_public_id: claimPublicId, action }),
    }),
  opsScheduledEvents: () => api<Record<string, unknown>[]>("/ops/scheduled-events"),
  opsAddScheduledEvent: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/ops/scheduled-events", { method: "POST", body: JSON.stringify(body) }),
  opsZoneAlert: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/ops/zone-alerts", { method: "POST", body: JSON.stringify(body) }),
  refreshZoneMetrics: (zone: string) =>
    api<Record<string, unknown>>(`/ops/zone-metrics/refresh?zone=${encodeURIComponent(zone)}`, { method: "POST" }),

  triggersActive: (city: string, zone: string) =>
    api<Record<string, unknown>>(
      `/triggers/active?city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zone)}`
    ),

  triggersCatalog: () => api<Record<string, unknown>[]>("/triggers/catalog"),
};
