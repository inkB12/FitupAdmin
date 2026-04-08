"use client";

import { useEffect, useState } from "react";

import { AdminSearchProvider } from "@/components/admin/AdminSearchContext";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  return (
    <AdminSearchProvider value={{ query: searchQuery, debouncedQuery, setQuery: setSearchQuery }}>
      <div className="admin-shell relative overflow-x-hidden text-white">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(240,179,91,0.14),transparent_55%)]" />
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="relative md:pl-72">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="relative px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </AdminSearchProvider>
  );
}

