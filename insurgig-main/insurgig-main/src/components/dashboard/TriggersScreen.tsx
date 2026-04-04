import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { insurGigApi } from "@/lib/api";

const CITIES = ["Bengaluru", "Chennai", "Mumbai", "Delhi"];

const TriggersScreen = () => {
  const qc = useQueryClient();
  const [city, setCity] = useState("Bengaluru");

  const { data: catalog = [] } = useQuery({
    queryKey: ["triggers-catalog"],
    queryFn: () => insurGigApi.triggersCatalog(),
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ["trigger-overrides"],
    queryFn: () => insurGigApi.opsTriggerOverrides(),
  });

  const { data: status = [], refetch: refetchStatus } = useQuery({
    queryKey: ["ops-triggers-status", city],
    queryFn: () => insurGigApi.opsTriggersStatus(city),
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["trigger-audit"],
    queryFn: () => insurGigApi.opsTriggerAudit(),
  });

  const addDryDayMut = useMutation({
    mutationFn: () =>
      insurGigApi.opsAddScheduledEvent({
        event_date: new Date().toISOString().slice(0, 10),
        event_type: "eci_dry_day",
        title: `ECI-style dry day (${city})`,
        city,
        armed: true,
      }),
    onSuccess: () => {
      toast.success("Scheduled event stored — T7 will evaluate true for this date & city.");
      qc.invalidateQueries({ queryKey: ["ops-triggers-status"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const toggleMut = useMutation({
    mutationFn: (body: { trigger_id: string; disabled: boolean }) =>
      insurGigApi.opsToggleTrigger({
        trigger_id: body.trigger_id,
        zone_name: "*",
        disabled: body.disabled,
        operator: "ops_console",
        reason: "Manual override from dashboard",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trigger-overrides"] });
      qc.invalidateQueries({ queryKey: ["trigger-audit"] });
      refetchStatus();
    },
  });

  const disabledSet = useMemo(() => {
    const s = new Set<string>();
    overrides.forEach((o) => {
      if (o.zone_name === "*" && o.disabled) s.add(String(o.trigger_id));
    });
    return s;
  }, [overrides]);

  const statusById = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    status.forEach((r) => m.set(String(r.trigger), r));
    return m;
  }, [status]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Trigger Management</h1>
        <p className="text-sm text-muted-foreground">Catalog + live evaluation by city (server)</p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <select
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-card text-foreground"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => refetchStatus()}
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-secondary"
        >
          Refresh grid
        </button>
        <button
          type="button"
          onClick={() => addDryDayMut.mutate()}
          className="text-xs border border-border rounded-button px-3 py-1.5 bg-primary text-primary-foreground"
        >
          Add dry day (today) for {city}
        </button>
      </div>

      <div className="bg-card rounded-card border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border bg-secondary">
              <th className="text-left px-3 py-2.5 font-medium">#</th>
              <th className="text-left px-3 py-2.5 font-medium">Trigger</th>
              <th className="text-left px-3 py-2.5 font-medium">Category</th>
              <th className="text-left px-3 py-2.5 font-medium">Live (zones w/ fire)</th>
              <th className="text-left px-3 py-2.5 font-medium">Threshold</th>
              <th className="text-left px-3 py-2.5 font-medium">Global override</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((t) => {
              const id = String(t.id);
              const st = statusById.get(id);
              const fired = st ? Number(st.fired_zones ?? 0) : 0;
              const total = st ? Number(st.active_zones ?? 0) : 0;
              const off = disabledSet.has(id);
              return (
                <tr key={id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-foreground">{id}</td>
                  <td className="px-3 py-2 text-foreground">{String(t.name)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{String(t.category)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {total ? `${fired} / ${total}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px]">{String(t.threshold)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleMut.mutate({ trigger_id: id, disabled: !off })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${off ? "bg-muted" : "bg-accent"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-all ${
                          off ? "left-0.5" : "left-5"
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-[10px] text-muted-foreground">{off ? "Disarmed" : "Armed"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-card border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Manual Overrides</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 font-medium">Time</th>
              <th className="text-left py-2 font-medium">Operator</th>
              <th className="text-left py-2 font-medium">Trigger</th>
              <th className="text-left py-2 font-medium">Action</th>
              <th className="text-left py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((l, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-2 text-muted-foreground">{String(l.time)}</td>
                <td className="py-2 text-foreground">{String(l.operator)}</td>
                <td className="py-2 text-foreground font-medium">{String(l.trigger)}</td>
                <td className="py-2 text-foreground">{String(l.action)}</td>
                <td className="py-2 text-muted-foreground italic">&quot;{String(l.reason)}&quot;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TriggersScreen;
