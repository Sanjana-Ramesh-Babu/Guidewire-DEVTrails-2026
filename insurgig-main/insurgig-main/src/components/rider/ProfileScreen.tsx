import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { TIERS } from "../../lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";

interface Props {
  rider?: RiderProfile | null;
  onLogout?: () => void;
  onPaidPremium?: () => void;
}

const ProfileScreen = ({ rider, onLogout, onPaidPremium }: Props) => {
  const [payBusy, setPayBusy] = useState(false);
  const initials = (rider?.name ?? "RK")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tierKey = (rider?.tier ?? "fulltime") as keyof typeof TIERS;
  const tierLabel = TIERS[tierKey].label;
  const premium = rider?.premium ?? 129;
  const mutualAid = Math.round(premium * 0.1 * 10) / 10;
  const platform = rider?.platform ?? "zomato";
  const zone = rider?.zone ?? "Koramangala";
  const city = rider?.city ?? "Bengaluru";

  const { data: dash } = useQuery({
    queryKey: ["rider-dashboard", rider?.publicId],
    enabled: Boolean(rider?.publicId),
    queryFn: () => insurGigApi.dashboard(rider!.publicId),
  });
  const pool = Number(dash?.mutual_aid_pool_zone ?? 0);

  const needsPay = rider?.currentWeekPremiumPaid === false && (rider?.outstandingPremium ?? 0) > 0;

  const payNow = async () => {
    if (!rider?.publicId) return;
    setPayBusy(true);
    try {
      await insurGigApi.payWeekPremium(rider.publicId);
      onPaidPremium?.();
    } finally {
      setPayBusy(false);
    }
  };

  const settings: { label: string; value: string; active: boolean }[] = [
    { label: "Mobile", value: rider?.phoneMasked ?? "—", active: Boolean(rider?.phoneMasked) },
    { label: "Payout UPI", value: rider?.upiId ?? "—", active: true },
    { label: "Plan name", value: tierLabel, active: false },
    { label: "Weekly contribution", value: `₹${premium}`, active: false },
    {
      label: "This week’s payment",
      value: needsPay ? `Due ₹${Number(rider?.outstandingPremium).toLocaleString("en-IN")}` : "Paid",
      active: !needsPay,
    },
  ];

  return (
    <div className="pb-20 bg-secondary min-h-screen">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {initials}
          </div>
          <h3 className="text-base font-semibold text-foreground">{rider?.name ?? "Rider"}</h3>
          <span className="px-3 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold capitalize">
            {platform}
          </span>
          <p className="text-xs text-muted-foreground">
            {city} · {zone}
          </p>
        </div>

        <div className="bg-card rounded-card border border-border divide-y divide-border">
          {settings.map((s) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground text-right max-w-[180px] truncate">{s.value}</span>
                {s.active && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
              </div>
            </div>
          ))}
        </div>

        {needsPay && (
          <button
            type="button"
            disabled={payBusy}
            onClick={() => void payNow()}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {payBusy ? "Processing…" : "Pay this week (demo)"}
          </button>
        )}

        <div className="bg-primary/5 rounded-card border border-primary/20 p-4">
          <h4 className="text-xs font-semibold text-foreground mb-1">Mutual Aid Pool</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            10% of your premium (₹{mutualAid}/week) is recorded toward your zone pool on the server.
          </p>
          <p className="text-xs font-semibold text-foreground mt-2">
            Zone pool balance (ledger): ₹{pool.toLocaleString("en-IN")}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-button border border-border text-sm text-destructive font-medium"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
