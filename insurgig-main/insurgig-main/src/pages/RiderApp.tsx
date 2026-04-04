import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/rider/BottomNav";
import OnboardingScreen from "@/components/rider/OnboardingScreen";
import RiderSignupWizard from "@/components/rider/RiderSignupWizard";
import RiderLoginScreen from "@/components/rider/RiderLoginScreen";
import HomeScreen from "@/components/rider/HomeScreen";
import PolicyScreen from "@/components/rider/PolicyScreen";
import ClaimsScreen from "@/components/rider/ClaimsScreen";
import EarningsScreen from "@/components/rider/EarningsScreen";
import ProfileScreen from "@/components/rider/ProfileScreen";
import { insurGigApi } from "@/lib/api";

const STORAGE_KEY = "insurgig_rider_public_id";

export interface RiderProfile {
  publicId: string;
  name: string;
  zone: string;
  city: string;
  platform: string;
  weeklyHours: number;
  monthlyEarnings: number;
  tier: string;
  premium: number;
  coverageCap: number;
  coveragePct: number;
  upiId: string;
  policyPeriod: string;
  currentWeekPremiumPaid?: boolean;
  outstandingPremium?: number;
  phoneMasked?: string;
}

function weekRangeLabel(): string {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export function mapRiderApi(r: Record<string, unknown>): RiderProfile {
  return {
    publicId: String(r.public_id),
    name: String(r.name),
    zone: String(r.zone),
    city: String(r.city),
    platform: String(r.platform),
    weeklyHours: Number(r.weekly_hours),
    monthlyEarnings: Number(r.monthly_earnings),
    tier: String(r.tier),
    premium: Number(r.premium),
    coverageCap: Number(r.coverage_cap),
    coveragePct: Number(r.coverage_pct),
    upiId: String(r.upi_id),
    policyPeriod: weekRangeLabel(),
    currentWeekPremiumPaid:
      r.current_week_premium_paid === undefined ? true : Boolean(r.current_week_premium_paid),
    outstandingPremium: r.outstanding_premium != null ? Number(r.outstanding_premium) : undefined,
    phoneMasked: r.phone_masked != null ? String(r.phone_masked) : undefined,
  };
}

const RiderApp = () => {
  const qc = useQueryClient();
  const [screen, setScreen] = useState("onboarding");
  const [showWizard, setShowWizard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [rider, setRider] = useState<RiderProfile | null>(null);

  const refreshRider = useCallback(
    async (publicId: string) => {
      const raw = await insurGigApi.getRider(publicId);
      setRider(mapRiderApi(raw as Record<string, unknown>));
      await qc.invalidateQueries({ queryKey: ["rider-dashboard", publicId] });
      await qc.invalidateQueries({ queryKey: ["premium-history", publicId] });
    },
    [qc]
  );

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return;
    insurGigApi
      .getRider(id)
      .then((raw) => {
        setRider(mapRiderApi(raw as Record<string, unknown>));
        setScreen("home");
        void qc.invalidateQueries({ queryKey: ["claims", id] });
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
  }, [qc]);

  const handleGetStarted = () => setShowWizard(true);

  const handleWizardComplete = async (profile: RiderProfile) => {
    localStorage.setItem(STORAGE_KEY, profile.publicId);
    setRider(profile);
    setShowWizard(false);
    setScreen("home");
    await qc.invalidateQueries({ queryKey: ["rider-dashboard", profile.publicId] });
    await qc.invalidateQueries({ queryKey: ["premium-history", profile.publicId] });
    await qc.invalidateQueries({ queryKey: ["claims", profile.publicId] });
  };

  const handleLoginSuccess = async (profile: RiderProfile) => {
    localStorage.setItem(STORAGE_KEY, profile.publicId);
    setRider(profile);
    setShowLogin(false);
    setScreen("home");
    await qc.invalidateQueries({ queryKey: ["rider-dashboard", profile.publicId] });
    await qc.invalidateQueries({ queryKey: ["premium-history", profile.publicId] });
    await qc.invalidateQueries({ queryKey: ["claims", profile.publicId] });
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRider(null);
    setScreen("onboarding");
    setShowWizard(false);
    setShowLogin(false);
  };

  if (showLogin) {
    return (
      <div className="flex justify-center bg-muted min-h-screen">
        <RiderLoginScreen
          onSuccess={(p) => void handleLoginSuccess(p)}
          onBack={() => setShowLogin(false)}
          mapApiToProfile={mapRiderApi}
        />
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="flex justify-center bg-muted min-h-screen">
        <RiderSignupWizard
          onComplete={(p) => void handleWizardComplete(p)}
          onBack={() => setShowWizard(false)}
          mapApiToProfile={mapRiderApi}
        />
      </div>
    );
  }

  if (screen === "onboarding") {
    return (
      <div className="flex justify-center bg-muted min-h-screen">
        <div className="w-[390px] relative bg-secondary shadow-sm">
          <OnboardingScreen onGetStarted={handleGetStarted} onLogin={() => setShowLogin(true)} />
        </div>
      </div>
    );
  }

  const screens: Record<string, React.ReactNode> = {
    home: (
      <HomeScreen
        rider={rider}
        onPaidPremium={() => rider && void refreshRider(rider.publicId)}
      />
    ),
    policy: <PolicyScreen rider={rider} />,
    claims: <ClaimsScreen rider={rider} />,
    earnings: <EarningsScreen rider={rider} />,
    profile: (
      <ProfileScreen
        rider={rider}
        onLogout={handleLogout}
        onPaidPremium={() => rider && void refreshRider(rider.publicId)}
      />
    ),
  };

  const navScreen = screen === "earnings" ? "home" : screen;

  return (
    <div className="flex justify-center bg-muted min-h-screen">
      <div className="w-[390px] relative bg-secondary shadow-sm">
        {screens[screen]}
        <BottomNav active={navScreen} onNavigate={setScreen} />
      </div>
    </div>
  );
};

export default RiderApp;
