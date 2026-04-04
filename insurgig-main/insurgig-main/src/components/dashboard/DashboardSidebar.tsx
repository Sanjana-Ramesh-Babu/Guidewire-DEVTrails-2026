import { Home, Map, ShieldAlert, ClipboardList, IndianRupee, Users, Zap, Settings, Shield } from "lucide-react";

export type OpsBadgeKey = "fraud_alerts_open" | "analyst_queue_pending";

const navItems: { id: string; label: string; icon: typeof Home; badgeKey?: OpsBadgeKey }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "zone-risk", label: "Zone Risk Map", icon: Map },
  { id: "fraud", label: "Fraud Alerts", icon: ShieldAlert, badgeKey: "fraud_alerts_open" },
  { id: "analyst", label: "Analyst Queue", icon: ClipboardList, badgeKey: "analyst_queue_pending" },
  { id: "payouts", label: "Payouts", icon: IndianRupee },
  { id: "riders", label: "Riders", icon: Users },
  { id: "triggers", label: "Triggers", icon: Zap },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  active: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  /** Counts from `/ops/overview`; badges render only when the mapped key is &gt; 0. */
  badgeCounts?: Partial<Record<OpsBadgeKey, number>>;
}

const DashboardSidebar = ({ active, onNavigate, collapsed, badgeCounts }: Props) => (
  <aside
    className={`${collapsed ? "w-16" : "w-56"} bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 min-h-screen shrink-0`}
  >
    <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
      <Shield size={20} className="text-sidebar-primary-foreground shrink-0" />
      {!collapsed && <span className="font-bold text-sm">InsurGig Ops</span>}
    </div>
    <nav className="flex-1 py-3">
      {navItems.map((item) => {
        const isActive = active === item.id;
        const n = item.badgeKey != null ? Number(badgeCounts?.[item.badgeKey] ?? 0) : 0;
        const showBadge = item.badgeKey != null && n > 0;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            }`}
          >
            <item.icon size={16} className="shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {!collapsed && showBadge && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center tabular-nums">
                {n > 99 ? "99+" : n}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  </aside>
);

export default DashboardSidebar;
