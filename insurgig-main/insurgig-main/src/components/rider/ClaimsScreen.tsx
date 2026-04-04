import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { TIERS } from "../../lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";
import { collectClaimSignals } from "@/lib/deviceSignals";

interface Props {
  rider?: RiderProfile | null;
}

type ClaimStatus = "idle" | "processing" | "verified" | "paid" | "analyst";

const ClaimsScreen = ({ rider }: Props) => {
  const qc = useQueryClient();
  const tierKey = (rider?.tier ?? "fulltime") as keyof typeof TIERS;
  const zone = rider?.zone ?? "Koramangala";
  const platform = rider?.platform ?? "zomato";

  const [modalRows, setModalRows] = useState<[string, string][] | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
  const [triggerFiredAt] = useState(() => new Date());

  const { data: pastClaims = [], refetch: refetchClaims } = useQuery({
    queryKey: ["claims", rider?.publicId],
    enabled: Boolean(rider?.publicId),
    queryFn: () => insurGigApi.listClaims(rider!.publicId),
  });

  const advanceAfterSubmit = useCallback(
    async (res: Record<string, unknown>) => {
      const routing = String(res.routing ?? "");
      const claimId = String(res.public_id ?? "");
      if (routing === "auto_approve") {
        setClaimStatus("paid");
        return;
      }
      if (routing === "analyst_review") {
        setClaimStatus("analyst");
        return;
      }
      setClaimStatus("verified");
      await new Promise((r) => setTimeout(r, 2200));
      try {
        await insurGigApi.finalizeSoftHold(claimId);
        setClaimStatus("paid");
      } catch {
        setClaimStatus("verified");
        setErr("Couldn’t finish automatically — try again in a moment.");
      }
      qc.invalidateQueries({ queryKey: ["claims", rider?.publicId] });
    },
    [qc, rider?.publicId]
  );

  const fileClaim = async () => {
    if (!rider?.publicId) return;
    setLoading(true);
    setErr(null);
    setLastResponse(null);
    setClaimStatus("processing");
    try {
      const signals = await collectClaimSignals(triggerFiredAt);
      const res = await insurGigApi.submitClaim(rider.publicId, signals);
      setLastResponse(res);
      await refetchClaims();
      await advanceAfterSubmit(res);
    } catch (e) {
      setClaimStatus("idle");
      setErr(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  const resetClaim = () => {
    setClaimStatus("idle");
    setLastResponse(null);
    setErr(null);
  };

  const triggers = (lastResponse?.triggers as Array<Record<string, unknown>>) ?? [];
  const firedCount = Number(lastResponse?.fired_trigger_ids?.length ?? triggers.filter((t) => t.fired).length);
  const stacked = Number(lastResponse?.severity_multiplier ?? lastResponse?.stacked_multiplier ?? 1);
  const payout = Number(lastResponse?.payout_amount ?? 0);
  const baseline = Number(lastResponse?.baseline_income ?? 0);
  const actual = Number(lastResponse?.actual_income ?? 0);
  const tcs = lastResponse?.tcs_score != null ? Number(lastResponse.tcs_score) : null;
  const routing = String(lastResponse?.routing ?? "");

  const stepIndex = { idle: -1, processing: 0, verified: 1, paid: 2, analyst: 1 }[claimStatus];

  useEffect(() => {
    if (claimStatus === "paid") {
      qc.invalidateQueries({ queryKey: ["rider-dashboard", rider?.publicId] });
    }
  }, [claimStatus, qc, rider?.publicId]);

  return (
    <div className="pb-20 bg-secondary min-h-screen">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Income support</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">One tap — we compare your usual day to today and pay to your UPI if you qualify.</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {err && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-button">{err}</p>}

        {claimStatus === "idle" && (
          <button
            type="button"
            onClick={fileClaim}
            disabled={loading || !rider?.publicId}
            className="w-full bg-destructive text-white font-semibold py-3.5 rounded-button text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Zap size={16} />
            {loading ? "Sending your request…" : "Request support for today"}
          </button>
        )}

        {triggers.length > 0 && claimStatus !== "idle" && (
          <div className="bg-card rounded-card border border-border p-3 space-y-2">
            <p className="text-[10px] font-semibold text-foreground">
              What we checked ({firedCount} unusual of {triggers.length})
            </p>
            {triggers.map((t) => (
              <div key={String(t.id)} className="flex items-start gap-2">
                <div
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${t.fired ? "bg-amber-500" : "bg-muted-foreground/40"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-medium ${t.fired ? "text-foreground" : "text-muted-foreground"}`}>
                    {String(t.name)}
                  </p>
                  <p className="text-[9px] text-muted-foreground break-words">{String(t.detail)}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
              Combined effect on your payout: ×{stacked}
            </p>
          </div>
        )}

        {claimStatus !== "idle" && (
          <div
            className={`bg-card rounded-card border-2 p-4 space-y-3 ${
              claimStatus === "paid" ? "border-accent" : "border-warning"
            }`}
          >
            <div className="flex items-center justify-between">
              <StatusBadge
                status={claimStatus === "paid" ? "paid" : claimStatus === "analyst" ? "active" : "processing"}
              >
                {claimStatus === "processing" && "Working on it"}
                {claimStatus === "verified" && "Quick check"}
                {claimStatus === "paid" && "Paid"}
                {claimStatus === "analyst" && "Team review"}
              </StatusBadge>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-foreground font-medium">
                {triggers
                  .filter((t) => t.fired)
                  .map((t) => String(t.name))
                  .join(" · ") || "Your day was compared to a usual day"}
              </p>
              <p className="text-muted-foreground">
                {zone}, {rider?.city ?? "—"}
              </p>
              <p className="text-foreground font-semibold">
                {claimStatus === "paid" ? "Paid" : "Expected"}: ₹{payout.toLocaleString("en-IN")}
              </p>
            </div>

            {tcs !== null && (
              <div className="bg-secondary rounded-button px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">Safety check score</span>
                <span className="text-[11px] font-bold text-accent text-right">
                  {tcs}
                  {routing === "auto_approve"
                    ? " — instant"
                    : routing === "soft_hold"
                      ? " — extra check"
                      : " — manual review"}
                </span>
              </div>
            )}

            {claimStatus !== "analyst" && (
              <div className="flex items-center gap-1">
                {["Estimating", "Checked", "Paid"].map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`h-1.5 w-full rounded-full transition-colors duration-700 ${
                        i <= stepIndex ? "bg-accent" : "bg-muted"
                      }`}
                    />
                    <span
                      className={`text-[9px] ${i <= stepIndex ? "text-accent font-medium" : "text-muted-foreground"}`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {claimStatus === "analyst" && (
              <p className="text-[10px] text-muted-foreground">
                Our team will take a quick look and update you. This is not an accusation — just a standard review.
              </p>
            )}

            {claimStatus === "paid" && (
              <div className="bg-secondary rounded-button p-3 space-y-1.5 text-xs">
                <p className="font-semibold text-foreground mb-2">How we calculated it</p>
                {[
                  ["Usual earnings (estimate)", `₹${baseline.toLocaleString("en-IN")}`],
                  ["Today’s earnings (estimate)", `₹${actual.toLocaleString("en-IN")}`],
                  ["Your plan pays", `${TIERS[tierKey].coverage * 100}%`],
                  ["Weather & local factors", `×${stacked}`],
                  ["Amount to you", `₹${payout.toLocaleString("en-IN")}`],
                  ["Sent to UPI", rider?.upiId ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-accent font-medium text-center">
                    Simulated UPI transfer — check your {platform} wallet
                  </p>
                </div>
              </div>
            )}

            {(claimStatus === "paid" || claimStatus === "analyst") && (
              <button
                type="button"
                onClick={resetClaim}
                className="w-full text-xs text-muted-foreground underline text-center pt-1"
              >
                Dismiss / new claim (next day)
              </button>
            )}
          </div>
        )}

        <h3 className="text-xs font-semibold text-foreground">History</h3>
        {pastClaims.length === 0 ? (
          <p className="text-xs text-muted-foreground">No claims yet.</p>
        ) : (
          pastClaims.map((c) => {
            return (
              <div key={String(c.public_id)} className="bg-card rounded-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">{String(c.created_at).slice(0, 10)}</span>
                  <StatusBadge
                    status={
                      c.status === "paid"
                        ? "paid"
                        : c.status === "rejected"
                          ? "rejected"
                          : "processing"
                    }
                  >
                    {c.status === "rejected" ? "Rejected" : String(c.status)}
                  </StatusBadge>
                </div>
                <p className="text-xs font-medium text-foreground">Income support · {zone}</p>
                {c.status === "rejected" && (
                  <p className="text-[10px] text-destructive mt-1">
                    This request was not approved. If you think this is a mistake, contact support through your partner
                    app.
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-foreground">
                    ₹{Number(c.payout_amount ?? 0).toLocaleString("en-IN")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setModalRows([
                        ["Usual earnings (estimate)", `₹${Number(c.baseline_income).toLocaleString("en-IN")}`],
                        ["Today’s earnings (estimate)", `₹${Number(c.actual_income).toLocaleString("en-IN")}`],
                        [
                          "Your plan pays",
                          `${((rider?.coveragePct ?? TIERS[tierKey].coverage) * 100).toFixed(0)}%`,
                        ],
                        ["Local conditions effect", `×${Number(c.severity_multiplier)}`],
                        ["Amount to you", `₹${Number(c.payout_amount).toLocaleString("en-IN")}`],
                        ["Sent to UPI", rider?.upiId ?? "—"],
                        ["Date", String(c.created_at).slice(0, 10)],
                      ])
                    }
                    className="text-[11px] text-primary font-medium"
                  >
                    View breakdown
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalRows && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-end justify-center">
          <div className="w-[390px] bg-card rounded-t-2xl p-5 pb-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Breakdown</h3>
              <button type="button" onClick={() => setModalRows(null)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {modalRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-foreground text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsScreen;
