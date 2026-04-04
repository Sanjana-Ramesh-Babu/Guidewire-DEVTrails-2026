import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { TIERS } from "../../lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";

interface Props {
  rider?: RiderProfile | null;
}

const PolicyScreen = ({ rider }: Props) => {
  const [formulaOpen, setFormulaOpen] = useState(false);
  const tierKey = (rider?.tier ?? "fulltime") as keyof typeof TIERS;
  const tierInfo = TIERS[tierKey];
  const premium = rider?.premium ?? 129;
  const zone = rider?.zone ?? "Koramangala";
  const city = rider?.city ?? "Bengaluru";

  const { data: history = [] } = useQuery({
    queryKey: ["premium-history", rider?.publicId],
    enabled: Boolean(rider?.publicId),
    queryFn: () => insurGigApi.premiumHistory(rider!.publicId),
  });

  const { data: trig } = useQuery({
    queryKey: ["triggers-policy", city, zone],
    queryFn: () => insurGigApi.triggersActive(city, zone),
    refetchInterval: 180_000,
  });

  const rows = (trig?.triggers as Array<Record<string, unknown>>) ?? [];
  const armedPreview = rows.filter((t) => t.fired || String(t.id).startsWith("T"));

  const baseline = rider?.monthlyEarnings ? Math.round(rider.monthlyEarnings / 48) : 400;
  const mult = Number(trig?.stacked_multiplier ?? 1.5);
  const examplePayout = Math.min(
    tierInfo.cap,
    Math.round(Math.max(0, baseline) * tierInfo.coverage * mult)
  );

  return (
    <div className="pb-20 bg-secondary min-h-screen">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Your Policy</h2>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-card border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Policy (server)</span>
            <StatusBadge status="paid">Active</StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Tier</span>
              <p className="font-medium text-foreground">{tierInfo.label}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Premium</span>
              <p className="font-medium text-foreground">₹{premium}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Coverage cap</span>
              <p className="font-medium text-foreground">₹{tierInfo.cap.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Period</span>
              <p className="font-medium text-foreground">{rider?.policyPeriod ?? "This week"}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormulaOpen(!formulaOpen)}
          className="w-full bg-card rounded-card border border-border p-4 text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">How your payout is calculated</span>
            {formulaOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          {formulaOpen && (
            <div className="mt-3 text-xs text-muted-foreground space-y-2">
              <p className="font-mono text-foreground text-[11px] bg-secondary p-2 rounded-button">
                Payout = (Baseline − Actual) × {tierInfo.coverage * 100}% × Multiplier (capped)
              </p>
              <p>
                Illustrative zero-earnings window: baseline ₹{baseline}, multiplier {mult}x → about ₹{examplePayout}{" "}
                (actual ISS uses XGBoost baseline + live triggers).
              </p>
            </div>
          )}
        </button>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Trigger snapshot</h3>
          <div className="flex flex-wrap gap-2">
            {rows.slice(0, 8).map((t) => (
              <div key={String(t.id)} className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1">
                <div
                  className={`w-2 h-2 rounded-full ${t.fired ? "bg-destructive" : "bg-muted-foreground"}`}
                />
                <span className="text-[11px] font-medium text-foreground">
                  {String(t.id)} {t.fired ? "on" : "off"}
                </span>
              </div>
            ))}
          </div>
          {armedPreview.length === 0 && <p className="text-[10px] text-muted-foreground mt-2">Loading triggers…</p>}
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Premium History</h3>
          <div className="space-y-2">
            {history.map((row) => (
              <div key={row.week_start} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground w-28">{row.week_start}</span>
                <span className="text-foreground">{row.tier_label}</span>
                <span className="font-medium text-foreground">₹{row.amount}</span>
                <StatusBadge status="paid">{row.status}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyScreen;
