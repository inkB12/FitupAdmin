import { ArrowDownRight, ArrowUpRight, Activity, CalendarDays, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: "users" | "calendar" | "wallet" | "activity";
};

const iconMap = {
  users: Users,
  calendar: CalendarDays,
  wallet: Wallet,
  activity: Activity,
} as const;

export default function KpiCard({ title, value, delta, trend, icon }: KpiCardProps) {
  const Icon = iconMap[icon];

  return (
    <article className="admin-surface rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">{title}</p>
        <div className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-[#f0b35b]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="text-3xl font-black text-white">{value}</p>

      <p
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-xs font-semibold",
          trend === "up" ? "text-emerald-200" : "text-amber-200"
        )}
      >
        {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {delta}
      </p>
    </article>
  );
}
