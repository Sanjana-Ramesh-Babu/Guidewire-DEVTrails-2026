import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CloudRain, Vote, CheckCircle, AlertCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { TIERS } from "../../lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";

interface Props {
  rider?: RiderProfile | null;
  onPaidPremium?: () => void;
}

const HomeScreen = ({ rider, onPaidPremium }: Props) => {
  const [payBusy, setPayBusy] = useState(false);
  const tierKey = (rider?.tier ?? "fulltime") as keyof typeof TIERS;
  const tierInfo = TIERS[tierKey];
  const premium = rider?.premium ?? 129;
  const zone = rider?.zone ?? "";
  const cap = rider?.coverageCap ?? tierInfo.cap;
  const needsPay = rider?.currentWeekPremiumPaid === false && (rider?.outstandingPremium ?? 0) > 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["rider-dashboard", rider?.publicId],
    enabled: Boolean(rider?.publicId),
    queryFn: () => insurGigApi.dashboard(rider!.publicId),
    refetchInterval: 120_000,
  });

  const trig = data?.triggers as Record<string, unknown> | undefined;
  const triggerRows = (trig?.triggers as Array<Record<string, unknown>>) ?? [];
  const forecast = (data?.risk_forecast as Array<Record<string, unknown>>) ?? [];
  const stats = (data?.stats as Record<string, unknown>) ?? {};
  const pool = Number(data?.mutual_aid_pool_zone ?? 0);

  const firedList = triggerRows.filter((t) => t.fired);

  const payNow = async () => {
    if (!rider?.publicId) return;
    setPayBusy(true);
    try {
      await insurGigApi.payWeekPremium(rider.publicId);
      onPaidPremium?.();
      await refetch();
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <div className="pb-20 bg-secondary min-h-screen">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <span className="text-sm font-semibold text-foreground">Hi, {rider?.name ?? "Rider"}</span>
        <button type="button" onClick={() => refetch()} className="p-1 rounded-button hover:bg-muted" aria-label="Refresh">
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-card">
            <AlertCircle size={16} />
            Can’t reach the server — start the API (see README).
          </div>
        )}

        {needsPay && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">This week’s contribution is pending</p>
            <p className="text-xs text-muted-foreground">
              Pay ₹{Number(rider?.outstandingPremium).toLocaleString("en-IN")} (demo — no real charge) to show as paid on your profile.
            </p>
            <button
              type="button"
              disabled={payBusy}
              onClick={() => void payNow()}
              className="w-full py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {payBusy ? "Processing…" : "Pay now"}
            </button>
          </div>
        )}

        <div className="bg-primary rounded-card p-4 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={needsPay ? "processing" : "paid"} className="text-[10px]">
              {needsPay ? "Payment pending" : "Protection active"}
            </StatusBadge>
            <span className="text-xs opacity-80">{tierInfo.label}</span>
          </div>
          <div className="text-2xl font-bold">
            ₹{premium} <span className="text-sm font-normal opacity-80">/ week</span>
          </div>
          <p className="text-xs mt-1 opacity-80">Up to ₹{cap.toLocaleString("en-IN")} if you claim this week</p>
          <p className="text-[10px] mt-2 opacity-60">We use your area and activity to set this amount (server + ML).</p>
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Heads-up for your area</h3>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : forecast.length === 0 ? (
            <p className="text-xs text-muted-foreground">No major public events scheduled for the next few days in the system.</p>
          ) : (
            <div className="space-y-3">
              {forecast.slice(0, 5).map((e) => (
                <div key={`${e.date}-${e.title}`} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Vote size={16} className="text-warning shrink-0" />
                    <span className="text-xs text-foreground truncate">
                      {String(e.title)} · {String(e.date)}
                    </span>
                  </div>
                  <StatusBadge status="armed">Note</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">What might affect earnings · {zone || "your zone"}</h3>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Checking weather and local signals…</p>
          ) : firedList.length === 0 ? (
            <div className="flex items-center gap-3 bg-secondary rounded-button p-3">
              <CheckCircle size={18} className="text-accent shrink-0" />
              <p className="text-xs text-muted-foreground">Nothing unusual flagged right now. You can still file a request if your day was worse than usual.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {firedList.map((t) => (
                <div key={String(t.id)} className="flex items-center gap-3 bg-secondary rounded-button p-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{String(t.name)}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{String(t.detail)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Earned this month (est.)", value: `₹${Number(stats.earned_month_proxy ?? 0).toLocaleString("en-IN")}` },
            { label: "Claims paid", value: String(stats.claims_paid ?? 0) },
            { label: "Weeks covered", value: String(stats.weeks_covered ?? 1) },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-card border border-border p-3 text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-card border border-border p-3 flex items-center gap-2">
          <CloudRain size={16} className="text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">Community pool in your zone (ledger): ₹{pool.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
