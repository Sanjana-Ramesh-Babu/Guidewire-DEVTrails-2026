import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Lock, MessageCircle } from "lucide-react";
import WhatsAppThread, { type ChatMessage } from "@/components/rider/WhatsAppThread";
import { insurGigApi } from "@/lib/api";
import { assignTier } from "@/lib/insuranceEngine";
import type { RiderProfile } from "@/pages/RiderApp";

interface Props {
  onComplete: (profile: RiderProfile) => void;
  onBack: () => void;
  mapApiToProfile: (raw: Record<string, unknown>) => RiderProfile;
}

type Step = "work" | "contact" | "otp" | "whatsapp" | "pay";

const RiderSignupWizard = ({ onComplete, onBack, mapApiToProfile }: Props) => {
  const [step, setStep] = useState<Step>("work");
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [platform, setPlatform] = useState("zomato");
  const [hours, setHours] = useState("40");
  const [earnings, setEarnings] = useState("18000");
  const [phone, setPhone] = useState("");
  const [upi, setUpi] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingPublicId, setPendingPublicId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [registeredAccount, setRegisteredAccount] = useState<Record<string, unknown> | null>(null);

  const { data: zones = [], isError: zonesErr } = useQuery({
    queryKey: ["catalog-zones"],
    queryFn: () => insurGigApi.catalogZones(),
    staleTime: 60_000,
  });

  const { data: tiersCatalog = {} } = useQuery({
    queryKey: ["catalog-tiers"],
    queryFn: () => insurGigApi.catalogTiers(),
    staleTime: 60_000,
  });

  const zoneObj = useMemo(() => zones.find((z) => String(z.name) === zone), [zones, zone]);
  const risk = Number(zoneObj?.risk_multiplier ?? 1);

  const previewTier = assignTier(Number(hours), Number(earnings), 1);
  const tierRow = tiersCatalog[previewTier] as Record<string, unknown> | undefined;
  const basePrem = Number(tierRow?.weekly_premium ?? 59);
  const tenureDiscount = Math.min(1 * 0.004, 0.12);
  const previewPrem = Math.round(basePrem * risk * (1 - tenureDiscount));
  const cap = Number(tierRow?.coverage_cap ?? 700);

  const canWork = name.trim().length > 1 && zone.length > 0;
  const canContact = phone.replace(/\D/g, "").length >= 10 && upi.includes("@");

  const sendOtp = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await insurGigApi.sendOtp(phone);
      if (typeof res.demo_otp === "string") setDemoOtp(res.demo_otp);
      setStep("otp");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await insurGigApi.verifyOtp(phone, otpCode.trim());
      await doRegister(res.token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async (token: string) => {
    setErr(null);
    const raw = await insurGigApi.register({
      name: name.trim(),
      zone,
      platform,
      weekly_hours: Number(hours),
      monthly_earnings: Number(earnings),
      tenure_weeks: 1,
      device_family_hash:
        typeof navigator !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "",
      phone,
      upi_id: upi.trim(),
      verification_token: token,
    });
    const id = String(raw.public_id);
    setRegisteredAccount(raw);
    setPendingPublicId(id);
    const { messages } = await insurGigApi.onboardingChat(id);
    setChatMessages(
      (messages as ChatMessage[]).map((m) => ({
        from: m.from as "bot" | "user",
        text: String(m.text),
        button: (m.button as ChatMessage["button"]) ?? null,
      }))
    );
    setStep("whatsapp");
  };

  const openPayment = () => setStep("pay");

  const completePayment = async () => {
    if (!pendingPublicId) return;
    setBusy(true);
    setErr(null);
    try {
      await insurGigApi.payWeekPremium(pendingPublicId);
      const fresh = await insurGigApi.getRider(pendingPublicId);
      onComplete(mapApiToProfile(fresh as Record<string, unknown>));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-[390px] bg-secondary shadow-sm min-h-screen flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-card">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">
          ← Back
        </button>
        <span className="text-xs font-semibold text-foreground flex-1 text-center pr-8">Join InsurGig</span>
      </div>

      <div className="flex-1 px-5 py-6 overflow-y-auto">
        {err && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg mb-4">{err}</p>}
        {zonesErr && (
          <p className="text-xs text-destructive mb-4">Could not load areas. Is the API running?</p>
        )}

        {step === "work" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">About your work</h2>
            <p className="text-xs text-muted-foreground">We use this to size your weekly contribution and protection limit (machine learning on the server).</p>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Your name</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Area you usually work</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="">Select area</option>
                {zones.map((z) => (
                  <option key={String(z.name)} value={String(z.name)}>
                    {String(z.name)} · {String(z.city)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs font-medium text-foreground block mb-2">App you deliver on</span>
              <div className="flex gap-2">
                {["zomato", "swiggy", "both"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                      platform === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Hours per week</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Approx. last month earnings (₹)</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                value={earnings}
                onChange={(e) => setEarnings(e.target.value)}
              />
            </div>
            {name && zone && (
              <div className="bg-primary rounded-xl p-4 text-primary-foreground">
                <p className="text-[10px] opacity-80 mb-1">Estimated from your inputs (final amount set on server)</p>
                <p className="text-xl font-bold">
                  ₹{previewPrem}
                  <span className="text-sm font-normal opacity-90"> / week</span>
                </p>
                <p className="text-xs opacity-80 mt-1">Protection up to ₹{cap.toLocaleString("en-IN")} this week</p>
              </div>
            )}
            <button
              type="button"
              disabled={!canWork}
              onClick={() => setStep("contact")}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Contact & payouts</h2>
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Lock size={14} className="shrink-0 mt-0.5" />
              We verify your mobile with a one-time code. Your UPI ID is where we send money when a claim is approved.
            </p>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Mobile number</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">UPI ID</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                placeholder="you@paytm"
              />
            </div>
            <button
              type="button"
              disabled={!canContact || busy}
              onClick={sendOtp}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send verification code"}
            </button>
            <button type="button" onClick={() => setStep("work")} className="w-full text-xs text-muted-foreground">
              Edit previous step
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Enter code</h2>
            <p className="text-xs text-muted-foreground">We sent a 6-digit code to your number. (Demo mode may show the code below.)</p>
            {demoOtp && (
              <p className="text-xs font-mono bg-muted p-3 rounded-lg text-foreground">Demo code: {demoOtp}</p>
            )}
            <input
              className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-widest bg-card text-foreground"
              inputMode="numeric"
              maxLength={8}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
            <button
              type="button"
              disabled={otpCode.length < 4 || busy}
              onClick={() => void verifyOtp()}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? "Creating your account…" : "Verify & create account"}
            </button>
          </div>
        )}

        {step === "whatsapp" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <MessageCircle size={18} className="text-[hsl(152,60%,28%)]" />
              <h2 className="text-lg font-bold">WhatsApp-style updates</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              In production you’d get these messages on WhatsApp. Here is the same thread inside the app.
            </p>
            <WhatsAppThread
              messages={chatMessages}
              onAction={(action) => {
                if (action === "open_payment") openPayment();
              }}
            />
            <button
              type="button"
              onClick={openPayment}
              className="w-full bg-[hsl(152,60%,28%)] text-white font-semibold py-3 rounded-lg text-sm"
            >
              Pay this week’s contribution (demo)
            </button>
          </div>
        )}

        {step === "pay" && (
          <div className="space-y-4 text-center py-8">
            <h2 className="text-lg font-bold text-foreground">Demo payment</h2>
            <p className="text-xs text-muted-foreground px-4">No real charge. This marks your week as paid in your profile.</p>
            <div className="bg-card border border-border rounded-xl p-6 mx-2">
              <p className="text-sm text-muted-foreground">Amount due</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ₹
                {Number(
                  registeredAccount?.outstanding_premium ?? registeredAccount?.premium ?? previewPrem
                ).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">UPI: {upi}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={completePayment}
              className="w-full max-w-xs mx-auto bg-accent text-accent-foreground font-semibold py-3 rounded-lg text-sm"
            >
              {busy ? "Processing…" : "Pay now"}
            </button>
            <button type="button" onClick={() => setStep("whatsapp")} className="text-xs text-muted-foreground block w-full">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderSignupWizard;
