import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { insurGigApi } from "@/lib/api";

const CITIES = ["Bengaluru", "Chennai", "Mumbai", "Delhi"];

const ZONES_BY_CITY: Record<string, string[]> = {
  Bengaluru: ["Koramangala", "HSR Layout", "Whitefield", "Indiranagar"],
  Mumbai: ["Andheri"],
  Chennai: ["Anna Nagar"],
  Delhi: ["Connaught Place"],
};

const ZoneRiskScreen = () => {
  const qc = useQueryClient();
  const [city, setCity] = useState("Bengaluru");
  const [zone, setZone] = useState("Koramangala");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["zone-risk", city, zone],
    queryFn: () => insurGigApi.triggersActive(city, zone),
  });

  const curfewMut = useMutation({
    mutationFn: () =>
      insurGigApi.opsZoneAlert({
        zone_name: zone,
        alert_type: "curfew",
        active: true,
        notes: "Demo curfew from ops console",
      }),
    onSuccess: () => {
      toast.success("Curfew alert stored for zone — T5 will evaluate true.");
      refetch();
      qc.invalidateQueries({ queryKey: ["ops-triggers-status"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const triggers = (data?.triggers as Array<Record<string, unknown>>) ?? [];
  const fired = triggers.filter((t) => t.fired);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Zone risk drill-down</h1>
      <p className="text-sm text-muted-foreground">Live GET /triggers/active for any seeded zone.</p>

      <div className="flex gap-3 flex-wrap">
        <select
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-card"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setZone(ZONES_BY_CITY[e.target.value]?.[0] ?? "");
          }}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-card"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          {(ZONES_BY_CITY[city] ?? []).map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            insurGigApi.refreshZoneMetrics(zone).then(() => refetch());
          }}
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-secondary"
        >
          Refresh zone metrics simulation
        </button>
        <button
          type="button"
          onClick={() => curfewMut.mutate()}
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-warning text-warning-foreground"
        >
          Arm demo curfew (T5) for {zone}
        </button>
      </div>

      <div className="bg-card rounded-card border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">
          {zone}, {city}
        </h3>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Fired: {fired.length} · Stacked multiplier: {String(data?.stacked_multiplier ?? 1)}×
            </p>
            <ul className="space-y-2 text-xs">
              {triggers.map((t) => (
                <li
                  key={String(t.id)}
                  className={`flex justify-between gap-2 ${t.fired ? "text-destructive font-medium" : "text-muted-foreground"}`}
                >
                  <span>
                    {String(t.id)} {String(t.name)}
                  </span>
                  <span className="text-right shrink-0">{t.fired ? "ACTIVE" : "clear"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ZoneRiskScreen;
