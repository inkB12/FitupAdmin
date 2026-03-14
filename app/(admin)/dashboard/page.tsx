"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import ApiPanel from "@/components/admin/ApiPanel";
import KpiCard from "@/components/admin/KpiCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi, type ApiResult } from "@/lib/client-api";
import { DASHBOARD_KPIS, TRANSACTIONS, USERS } from "@/lib/admin-data";

export default function DashboardPage() {
  const latestUsers = USERS.slice(0, 4);
  const latestTransactions = TRANSACTIONS.slice(0, 4);
  const [dashboardApi, setDashboardApi] = useState<ApiResult<unknown>>({ data: null, error: null });

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/DashBoard").then((result) => {
      if (active) {
        setDashboardApi(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-[linear-gradient(120deg,#121212_0%,#1b1b1b_60%,#2a1f18_100%)] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d68c45]">FITUP Admin</p>
        <h2 className="mt-3 text-2xl font-black md:text-3xl">Operations Overview</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300 md:text-base">
          Monitor platform growth, user activity, PT workloads, and finance status from one control room.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_KPIS.map((item) => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            delta={item.delta}
            trend={item.trend}
            icon={item.icon}
          />
        ))}
      </section>

      <ApiPanel title="Dashboard API" data={dashboardApi.data} error={dashboardApi.error} />

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">Recent Users</h3>
            <Link href="/users" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#d68c45]">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {latestUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">{user.plan}</p>
                  <StatusBadge label={user.status} tone={user.status === "active" ? "success" : "warning"} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">Latest Transactions</h3>
            <Link href="/transactions" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#d68c45]">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {latestTransactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <div>
                  <p className="font-semibold text-white">{item.customer}</p>
                  <p className="text-xs text-zinc-400">{item.packageName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{item.amount}</p>
                  <StatusBadge label={item.status} tone={item.status === "paid" ? "success" : "warning"} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
