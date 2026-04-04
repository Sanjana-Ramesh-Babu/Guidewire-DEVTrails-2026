import { useQuery } from "@tanstack/react-query";
import StatusBadge from "@/components/rider/StatusBadge";
import { insurGigApi } from "@/lib/api";

const PayoutsScreen = () => {
  const { data: payouts = [] } = useQuery({
    queryKey: ["ops-payouts"],
    queryFn: () => insurGigApi.opsRecentPayouts(50),
  });

  const total = payouts.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Payout analytics</h1>
      <p className="text-sm text-muted-foreground">
        Recent ledger rows · Total in view: ₹{total.toLocaleString("en-IN")}
      </p>
      <div className="bg-card rounded-card border border-border divide-y divide-border">
        {payouts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          payouts.map((p, i) => (
            <div key={i} className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium text-foreground">{String(p.rider)}</span>
                <span className="text-muted-foreground"> · {String(p.zone)}</span>
                <p className="text-xs text-muted-foreground">{String(p.trigger)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground">
                  ₹{Number(p.amount).toLocaleString("en-IN")}
                </span>
                <StatusBadge status={p.status === "paid" ? "paid" : "processing"}>
                  {String(p.status)}
                </StatusBadge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PayoutsScreen;
