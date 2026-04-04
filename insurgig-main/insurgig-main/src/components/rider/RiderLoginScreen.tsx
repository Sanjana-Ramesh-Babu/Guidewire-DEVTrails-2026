import { useState } from "react";
import { Shield } from "lucide-react";
import type { RiderProfile } from "@/pages/RiderApp";
import { insurGigApi } from "@/lib/api";

interface Props {
  onSuccess: (profile: RiderProfile) => void;
  onBack: () => void;
  mapApiToProfile: (raw: Record<string, unknown>) => RiderProfile;
}

const RiderLoginScreen = ({ onSuccess, onBack, mapApiToProfile }: Props) => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await insurGigApi.riderLoginOtpSend(phone);
      if (typeof res.demo_otp === "string") setDemoOtp(res.demo_otp);
      setStep("code");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr(null);
    setBusy(true);
    try {
      const raw = await insurGigApi.riderLoginVerify(phone, code.trim());
      onSuccess(mapApiToProfile(raw as Record<string, unknown>));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-secondary w-[390px] mx-auto">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground self-start mb-6">
        ← Back
      </button>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-card bg-primary flex items-center justify-center">
          <Shield size={22} className="text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Log in</span>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Enter the mobile number you used when you joined. We&apos;ll send a one-time code.
      </p>

      {err && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg mb-4">{err}</p>}

      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Mobile number</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-card text-foreground"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
            />
          </div>
          <button
            type="button"
            disabled={busy || phone.replace(/\D/g, "").length < 10}
            onClick={() => void sendCode()}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-4">
          {demoOtp && (
            <p className="text-xs font-mono bg-muted p-3 rounded-lg text-foreground">Demo code: {demoOtp}</p>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">6-digit code</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-3 text-center text-lg tracking-widest bg-card text-foreground"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </div>
          <button
            type="button"
            disabled={busy || code.length < 4}
            onClick={() => void verify()}
            className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setDemoOtp(null);
            }}
            className="w-full text-xs text-muted-foreground"
          >
            Change number
          </button>
        </div>
      )}
    </div>
  );
};

export default RiderLoginScreen;
