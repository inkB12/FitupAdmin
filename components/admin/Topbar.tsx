"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type TopbarProps = {
  onMenuClick: () => void;
};

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/trainers": "Trainers",
  "/packages": "Packages",
  "/blogs": "Blogs",
  "/transactions": "Transactions",
  "/bookings": "Bookings",
  "/conversion-rates": "Conversion Rates",
  "/workouts": "Workouts",
  "/settings": "Settings",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const activeTitle = titleMap[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#1f1f1f]/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-full border border-zinc-700 p-2 text-zinc-300 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">FITUP Control Room</p>
            <h1 className="text-lg font-extrabold text-white">{activeTitle}</h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex h-10 min-w-[280px] items-center gap-2 rounded-full border border-zinc-700 bg-[#121212] px-4 text-zinc-400">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search users, packages, blogs..."
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>

          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
