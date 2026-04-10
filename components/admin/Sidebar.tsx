"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Package,
  CreditCard,
  Wallet,
  CalendarCheck,
  Percent,
  LogOut,
  X,
} from "lucide-react";

import { SIDEBAR_ITEMS } from "@/lib/admin-data";
import { clearAuthSession } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  trainers: Dumbbell,
  packages: Package,
  transactions: CreditCard,
  "payment-history": Wallet,
  bookings: CalendarCheck,
  "conversion-rates": Percent,
} as const;

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuthSession();
    onClose();
    router.replace("/login");
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0b1420]/96 shadow-[18px_0_42px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-transform duration-200 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <Image src="/fitup-logo.png" alt="FITUP" width={36} height={36} className="h-9 w-9" priority />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--admin-muted)]">FITUP</p>
                <p className="text-lg font-black text-white">Admin</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-[var(--admin-soft)] hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = iconMap[item.key];
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.16),rgba(126,217,255,0.08))] text-white shadow-[0_10px_30px_rgba(240,179,91,0.08)]"
                      : "text-[var(--admin-muted)] hover:bg-white/[0.04] hover:text-white"
                  )}
                  onClick={onClose}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[#f0b35b]" : "text-[var(--admin-muted)]")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/8 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-3 py-3 text-sm font-semibold text-rose-100 transition-all duration-200 hover:border-rose-300/30 hover:bg-rose-500/16 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-rose-200" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
