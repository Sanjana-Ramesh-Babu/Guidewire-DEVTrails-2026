import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "armed" | "paid" | "processing" | "inactive" | "rejected";
  children: React.ReactNode;
  className?: string;
}

const statusClasses: Record<string, string> = {
  active: "status-active",
  armed: "status-armed",
  paid: "status-paid",
  processing: "status-processing",
  inactive: "status-inactive",
  rejected: "status-rejected",
};

const StatusBadge = ({ status, children, className }: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
      statusClasses[status],
      className
    )}
  >
    {children}
  </span>
);

export default StatusBadge;
