import { Home, FileText, Shield, User } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "policy", label: "Policy", icon: FileText },
  { id: "claims", label: "Claims", icon: Shield },
  { id: "profile", label: "Profile", icon: User },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-card border-t border-border flex justify-around py-2 z-50">
    {tabs.map((tab) => {
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
