import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { TIERS } from "../../lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";

interface Props {
  rider?: RiderProfile | null;
}

const EarningsScreen = ({ rider }: Props) => {
  const tierKey = (rider?.tier ?? "fulltime") as keyof typeof TIERS;
  const tierLabel = TIERS[tierKey].label;
  const zone = rider?.zone ?? "Koramangala";

  const { data, isLoading } = useQuery({
    queryKey: ["earnings", rider?.publicId],
    enabled: Boolean(rider?.publicId),
    queryFn: () => insurGigApi.earnings(rider!.publicId),
  });

  const baselinePer4hr = data?.baseline_per_4h ?? Math.round((rider?.monthlyEarnings ?? 18000) / 48);
  const baselineData = data?.series ?? [];

  const allTiers = ["starter", "casual", "fulltime", "power"];
  const currentIndex = allTiers.indexOf(tierKey);
  const tierTimeline = [
    { tier: "Starter", active: currentIndex >= 0 },
    { tier: "Casual", active: currentIndex >= 1 },
    { tier: "Full-time", active: currentIndex >= 2 },
    { tier: "Power Rider", active: currentIndex >= 3 },
  ].filter((_, i) => i <= Math.max(currentIndex + 1, 2));

  const recovery = data?.recovery_pct ?? 100;

  return (
    <div className="pb-20 bg-secondary min-h-screen">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Your Earnings Baseline</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-card border border-border p-4">
          <p className="text-[10px] text-muted-foreground mb-1">Personal baseline (model-assisted)</p>
          <p className="text-xl font-bold text-foreground">
            ₹{baselinePer4hr.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-muted-foreground">per 4-hour window</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{zone}</p>
          <p className="text-[10px] text-muted-foreground">8-week trend is generated from your profile hash (server)</p>

          <div className="mt-4 h-32">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading chart…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={baselineData}>
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(244,69%,42%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(244,69%,42%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-1">Tier Progression</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            Current: {tierLabel} · Reassigned weekly (LightGBM on server)
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {tierTimeline.map((t, i) => (
              <div key={t.tier} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium ${
                    t.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.tier}
                </div>
                {i < tierTimeline.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-2">Income Recovery Tracker</h3>
          {data?.last_disruption ? (
            <p className="text-[10px] text-muted-foreground">Last disruption: {data.last_disruption}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">No paid disruption claims yet.</p>
          )}
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${recovery}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Recovery signal: {recovery}% of baseline path</p>
        </div>
      </div>
    </div>
  );
};

export default EarningsScreen;
