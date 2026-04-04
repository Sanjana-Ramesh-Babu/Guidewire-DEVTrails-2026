import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insurGigApi } from "@/lib/api";

const FraudScreen = () => {
  const qc = useQueryClient();
  const { data: alerts = [], isError, isPending } = useQuery({
    queryKey: ["fraud-rings"],
    queryFn: () => insurGigApi.opsFraudRings(),
    refetchInterval: 15_000,
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => insurGigApi.opsResolveRing(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fraud-rings"] });
      qc.invalidateQueries({ queryKey: ["ops-overview"] });
    },
  });

  const held = alerts.reduce((s, a) => s + Number(a.accounts ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Fraud Alerts</h1>
        <p className="text-sm text-muted-foreground">
          {isPending ? "Loading…" : `${alerts.length} open ring alerts`}
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Could not load fraud alerts from the API.</p>
      )}

      {!isPending && !isError && alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No unresolved fraud ring alerts in the database.</p>
      ) : !isError ? (
        alerts.map((alert) => (
          <div
            key={String(alert.public_id)}
            className="bg-card rounded-card border-2 border-destructive p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-foreground">{String(alert.public_id).slice(0, 12)}…</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
                open
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Zone</span>
                <p className="font-medium text-foreground">{String(alert.zone)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Window</span>
                <p className="font-medium text-foreground">{String(alert.claims)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cluster density</span>
                <p className="font-medium text-foreground">{String(alert.density)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Accounts</span>
                <p className="font-medium text-foreground">{String(alert.accounts)}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => resolveMut.mutate(String(alert.public_id))}
                className="px-3 py-1.5 rounded-button bg-accent text-accent-foreground text-xs font-medium"
              >
                Mark resolved
              </button>
            </div>
          </div>
        ))
      ) : null}

      <div className="bg-card rounded-card border border-border p-4 flex gap-8 text-xs flex-wrap">
        <div>
          <span className="text-muted-foreground">Claims in open rings (sum)</span>
          <p className="font-bold text-foreground">{held}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Open alerts</span>
          <p className="font-bold text-foreground">{alerts.length}</p>
        </div>
      </div>
    </div>
  );
};

export default FraudScreen;
