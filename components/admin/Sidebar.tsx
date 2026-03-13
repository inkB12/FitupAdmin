"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Package,
  Newspaper,
  CreditCard,
  Settings,
  X,
} from "lucide-react";

import { SIDEBAR_ITEMS } from "@/lib/admin-data";
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
  blogs: Newspaper,
  transactions: CreditCard,
  settings: Settings,
} as const;

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-800 bg-[#121212] transition-transform duration-200 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <Image src="/fitup-logo.png" alt="FITUP" width={36} height={36} className="h-9 w-9" priority />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">FITUP</p>
                <p className="text-lg font-black text-white">Admin</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-700 p-2 text-zinc-400 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  )}
                  onClick={onClose}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[#d68c45]" : "text-zinc-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-800 p-4">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Environment</p>
              <p className="mt-1 text-sm font-semibold text-white">Production</p>
              <p className="mt-2 text-xs text-zinc-500">Admin UI is ready for API integration.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
