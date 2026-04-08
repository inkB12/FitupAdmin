"use client";

import { Bell, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { Button } from "@/components/ui/button";

type TopbarProps = {
  onMenuClick: () => void;
};

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/trainers": "Trainers",
  "/packages": "Premium Management",
  "/transactions": "Service Payment",
  "/payment-history": "Payment History",
  "/bookings": "Bookings",
  "/conversion-rates": "Conversion Rates",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const activeTitle = titleMap[pathname] ?? "Admin";
  const { query, setQuery } = useAdminSearch();

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#09111c]/84 backdrop-blur-xl">
      <div className="flex h-18 items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-[var(--admin-soft)] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--admin-muted)]">FITUP Control Room</p>
            <h1 className="text-lg font-extrabold text-white">{activeTitle}</h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex h-11 min-w-[320px] items-center gap-2 rounded-full border border-white/12 bg-[#0d1724]/92 px-4 text-[var(--admin-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <Search className="h-4 w-4 text-[var(--admin-accent)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users, packages, transactions..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[color:rgba(142,163,184,0.72)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full p-1 text-[var(--admin-muted)] hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4 text-[var(--admin-accent-soft)]" />
          </Button>
        </div>
      </div>
    </header>
  );
}

