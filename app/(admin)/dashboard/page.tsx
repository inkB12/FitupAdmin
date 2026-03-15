"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import KpiCard from "@/components/admin/KpiCard";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi } from "@/lib/client-api";
import { DASHBOARD_KPIS, TRANSACTIONS, USERS } from "@/lib/admin-data";

type DashboardRecord = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: DashboardRecord[];
};

const PAGE_SIZE = 6;

function buildPageNumbers(current: number, total: number) {
  if (total <= 1) {
    return [1];
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i > 1 && i < total) {
      pages.add(i);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function findArray(value: unknown, depth = 0): DashboardRecord[] | null {
  if (Array.isArray(value)) {
    return value as DashboardRecord[];
  }
  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findArray(entry, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

function buildTable(data: unknown): TableSpec | null {
  const rows = findArray(data);
  if (!rows || rows.length === 0) {
    return null;
  }
  const sample = rows.find((row) => row && typeof row === "object") ?? rows[0];
  if (!sample || typeof sample !== "object") {
    return null;
  }
  const columns = Object.keys(sample as Record<string, unknown>)
    .filter((column) => !column.toLowerCase().includes("id"))
    .slice(0, 6);
  return { columns, rows: rows as DashboardRecord[] };
}

function renderCell(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export default function DashboardPage() {
  const latestUsers = USERS.slice(0, 4);
  const latestTransactions = TRANSACTIONS.slice(0, 4);
  const [rawDashboard, setRawDashboard] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  useEffect(() => {
    let active = true;
    clientApi.get("/api/DashBoard").then((result) => {
      if (active) {
        setRawDashboard(result.data ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const table = useMemo(() => buildTable(rawDashboard), [rawDashboard]);
  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim(),
    [query, globalQuery],
  );

  const filteredRows = useMemo(() => {
    if (!table) {
      return [] as DashboardRecord[];
    }
    const term = combinedQuery.toLowerCase();
    if (!term) {
      return table.rows;
    }
    return table.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [table, combinedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-[linear-gradient(120deg,#121212_0%,#1b1b1b_60%,#2a1f18_100%)] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d68c45]">FITUP Admin</p>
        <h2 className="mt-3 text-2xl font-black md:text-3xl">Operations Overview</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300 md:text-base">
          Monitor platform growth, user activity, PT workloads, and finance status from one control room.
        </p>
      </section>

      {table ? (
        <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search dashboard data"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="text-xs text-zinc-500">Showing {pageRows.length} of {filteredRows.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  {table.columns.map((column) => (
                    <th key={column} className="pb-3">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={index} className="border-b border-zinc-800/60 text-zinc-200">
                    {table.columns.map((column) => (
                      <td key={column} className="py-3 text-xs">
                        {renderCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 disabled:opacity-50"
              >
                Prev
              </button>
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  className={`rounded-full border px-3 py-1 text-zinc-200 ${
                    number === currentPage
                      ? "border-emerald-400 text-emerald-200"
                      : "border-zinc-700"
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-zinc-200">Dashboard data is unavailable.</p>
            <p className="text-xs text-zinc-500">
              Showing default KPIs below until the API connects.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {DASHBOARD_KPIS.map((item) => (
              <div
                key={`fallback-${item.title}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">{item.title}</p>
                <p className="mt-2 text-xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.delta}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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

