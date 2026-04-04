import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import OverviewScreen from "@/components/dashboard/OverviewScreen";
import FraudScreen from "@/components/dashboard/FraudScreen";
import AnalystScreen from "@/components/dashboard/AnalystScreen";
import TriggersScreen from "@/components/dashboard/TriggersScreen";
import ZoneRiskScreen from "@/components/dashboard/ZoneRiskScreen";
import PayoutsScreen from "@/components/dashboard/PayoutsScreen";
import RidersScreen from "@/components/dashboard/RidersScreen";
import SettingsScreen from "@/components/dashboard/SettingsScreen";
import { insurGigApi } from "@/lib/api";

const Dashboard = () => {
  const [screen, setScreen] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ["ops-overview"],
    queryFn: () => insurGigApi.opsOverview(),
    refetchInterval: 30_000,
  });

  const badgeCounts = {
    fraud_alerts_open: Number(overview?.fraud_alerts_open ?? 0),
    analyst_queue_pending: Number(overview?.analyst_queue_pending ?? 0),
  };

  const screens: Record<string, React.ReactNode> = {
    overview: <OverviewScreen />,
    fraud: <FraudScreen />,
    analyst: <AnalystScreen />,
    triggers: <TriggersScreen />,
    "zone-risk": <ZoneRiskScreen />,
    payouts: <PayoutsScreen />,
    riders: <RidersScreen />,
    settings: <SettingsScreen />,
  };

  return (
    <div className="flex min-h-screen w-full bg-secondary">
      <DashboardSidebar
        active={screen}
        onNavigate={setScreen}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        badgeCounts={badgeCounts}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center border-b border-border bg-card px-4 gap-3">
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-foreground capitalize">{screen.replace("-", " ")}</span>
        </header>
        <main className="flex-1 overflow-auto">{screens[screen]}</main>
      </div>
    </div>
  );
};

export default Dashboard;
