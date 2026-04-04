import { useQuery } from "@tanstack/react-query";
import StatusBadge from "@/components/rider/StatusBadge";
import { insurGigApi } from "@/lib/api";

const OverviewScreen = () => {
  const { data: overview, isError } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: () => insurGigApi.opsOverview(),
    refetchInterval: 30_000,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["ops-payouts"],
    queryFn: () => insurGigApi.opsRecentPayouts(),
    refetchInterval: 20_000,
  });

  const { data: trigStatus = [] } = useQuery({
    queryKey: ["ops-triggers-status"],
    queryFn: () => insurGigApi.opsTriggersStatus(),
    refetchInterval: 60_000,
  });

  const metrics = [
    { label: "Active Riders", value: String(overview?.active_riders ?? "—") },
    { label: "Claims Today", value: String(overview?.claims_today ?? "—") },
    {
      label: "Payouts Today",
      value:
        overview?.payouts_today != null
          ? `₹${Number(overview.payouts_today).toLocaleString("en-IN")}`
          : "—",
    },
    { label: "Fraud Alerts", value: String(overview?.fraud_alerts_open ?? "—"), color: "text-destructive" },
    { label: "Analyst Queue", value: String(overview?.analyst_queue_pending ?? "—"), color: "text-destructive" },
    {
      label: "Pool (proxy)",
      value:
        overview?.premium_pool_proxy != null
          ? `₹${Number(overview.premium_pool_proxy).toLocaleString("en-IN")}`
          : "—",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Overview</h1>
      {isError && (
        <p className="text-sm text-destructive">Cannot load ops API — is the backend running on port 8000?</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-card border border-border p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color || "text-foreground"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Triggers across zones (aggregated)</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Trigger</th>
                <th className="text-left py-2 font-medium">Fired zones</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {trigStatus.slice(0, 12).map((t) => {
                const fz = Number(t.fired_zones ?? 0);
                const az = Number(t.active_zones ?? 0);
                const st = fz > 0 ? "active" : "inactive";
                return (
                  <tr key={String(t.trigger)} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-foreground">
                      {String(t.trigger)} {t.name ? `— ${String(t.name)}` : ""}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {fz} / {az}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={st === "active" ? "active" : "paid"}>
                        {st === "active" ? "Active" : "Clear"}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent claims / payouts</h3>
          <div className="space-y-3">
            {payouts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No claims yet.</p>
            ) : (
              payouts.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{String(p.rider)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · ₹{Number(p.amount).toLocaleString("en-IN")} · {String(p.trigger)} · {String(p.zone)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground text-[10px]">{p.time_ago_min}m ago</span>
                    <StatusBadge status={p.status === "paid" ? "paid" : "processing"}>
                      {String(p.status)}
                    </StatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewScreen;
