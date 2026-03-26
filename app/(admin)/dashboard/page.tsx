"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import KpiCard from "@/components/admin/KpiCard";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi } from "@/lib/client-api";

type DashboardRecord = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: DashboardRecord[];
};

type AccountRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
  role?: string;
  status?: string;
  plan?: string;
  createdAt?: string;
};

type ServicePayment = {
  id?: string;
  _id?: string;
  servicePaymentId?: string;
  client?: string;
  clientName?: string;
  service?: string;
  serviceName?: string;
  price?: number | string;
  amount?: number | string;
  status?: string;
  paidAt?: string;
  date?: string;
  createdAt?: string;
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

function findArrayByPredicate<T>(
  value: unknown,
  predicate: (item: Record<string, unknown>) => boolean,
  depth = 0
): T[] | null {
  if (Array.isArray(value)) {
    const hasMatch = value.some(
      (item) => item && typeof item === "object" && predicate(item as Record<string, unknown>)
    );
    return hasMatch ? (value as T[]) : null;
  }
  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findArrayByPredicate<T>(entry, predicate, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

function extractAccounts(payload: unknown): AccountRecord[] {
  return (
    findArrayByPredicate<AccountRecord>(payload, (item) => {
      return (
        "email" in item ||
        "name" in item ||
        "fullName" in item ||
        "username" in item ||
        "_id" in item ||
        "id" in item
      );
    }) ?? []
  );
}

function extractPayments(payload: unknown): ServicePayment[] {
  return (
    findArrayByPredicate<ServicePayment>(payload, (item) => {
      return (
        "service" in item ||
        "serviceName" in item ||
        "paidAt" in item ||
        "price" in item ||
        "amount" in item
      );
    }) ?? []
  );
}

function getAccountName(account: AccountRecord) {
  if (account.name) {
    return account.name;
  }
  if (account.fullName) {
    return account.fullName;
  }
  if (account.username) {
    return account.username;
  }
  if (account.email) {
    return account.email.includes("@") ? account.email.split("@")[0] : account.email;
  }
  return "User";
}

function formatCurrency(value: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

function parseAmount(value: number | string | undefined) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatPaymentAmount(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  if (typeof value === "number") {
    return formatCurrency(value);
  }
  return value;
}

function getStatusTone(status: string | number | null | undefined): "success" | "warning" | "neutral" {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("paid") || normalized.includes("complete") || normalized.includes("success")) {
    return "success";
  }
  if (normalized.includes("refund") || normalized.includes("cancel") || normalized.includes("fail")) {
    return "warning";
  }
  return "neutral";
}

type KpiCardSpec = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: "users" | "calendar" | "wallet" | "activity";
};

function extractKpis(payload: unknown): KpiCardSpec[] {
  const raw = findArrayByPredicate<Record<string, unknown>>(payload, (item) => {
    return ("title" in item || "label" in item) && "value" in item;
  });
  if (!raw) {
    return [];
  }
  const fallbackIcons: KpiCardSpec["icon"][] = ["users", "wallet", "activity", "calendar"];
  return raw.slice(0, 4).map((item, index) => {
    const title = String(item.title ?? item.label ?? "KPI");
    const value = item.value === undefined || item.value === null ? "-" : String(item.value);
    const delta = item.delta ? String(item.delta) : "Live data";
    const trend = item.trend === "down" ? "down" : "up";
    const icon =
      item.icon === "users" || item.icon === "wallet" || item.icon === "activity" || item.icon === "calendar"
        ? item.icon
        : fallbackIcons[index % fallbackIcons.length];
    return { title, value, delta, trend, icon };
  });
}

export default function DashboardPage() {
  const [rawDashboard, setRawDashboard] = useState<unknown>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [payments, setPayments] = useState<ServicePayment[]>([]);
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

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/admin/accounts").then((result) => {
      if (!active || result.error) {
        return;
      }
      setAccounts(extractAccounts(result.data));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/service-payments/admin/all").then((result) => {
      if (!active || result.error) {
        return;
      }
      setPayments(extractPayments(result.data));
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

  const kpis = useMemo(() => {
    const extracted = extractKpis(rawDashboard);
    if (extracted.length > 0) {
      return extracted;
    }
    if (accounts.length === 0 && payments.length === 0) {
      return [] as KpiCardSpec[];
    }
    const activeUsers = accounts.filter((account) =>
      String(account.status ?? "").toLowerCase().includes("active")
    ).length;
    const totalUsers = accounts.length;
    const paidCount = payments.filter((payment) => getStatusTone(payment.status) === "success").length;
    const warningCount = payments.filter((payment) => getStatusTone(payment.status) === "warning").length;
    const pendingCount = Math.max(0, payments.length - paidCount - warningCount);
    const revenueTotal = payments.reduce((sum, payment) => {
      return sum + parseAmount(payment.price ?? payment.amount);
    }, 0);
    const averageRevenue = payments.length > 0 ? revenueTotal / payments.length : 0;

    return [
      {
        title: "Total Users",
        value: String(totalUsers),
        delta: `Active: ${activeUsers}`,
        trend: activeUsers >= totalUsers - activeUsers ? "up" : "down",
        icon: "users",
      },
      {
        title: "Transactions",
        value: String(payments.length),
        delta: `Paid: ${paidCount}`,
        trend: paidCount >= payments.length - paidCount ? "up" : "down",
        icon: "activity",
      },
      {
        title: "Revenue",
        value: formatCurrency(revenueTotal),
        delta: `Avg: ${formatCurrency(averageRevenue)}`,
        trend: revenueTotal >= 0 ? "up" : "down",
        icon: "wallet",
      },
      {
        title: "Pending Payments",
        value: String(pendingCount),
        delta: `Refunded: ${warningCount}`,
        trend: pendingCount === 0 ? "up" : "down",
        icon: "calendar",
      },
    ];
  }, [rawDashboard, accounts, payments]);

  const latestUsers = useMemo(() => {
    if (accounts.length === 0) {
      return [] as AccountRecord[];
    }
    const sorted = [...accounts].sort((a, b) => {
      const left = Date.parse(a.createdAt ?? "");
      const right = Date.parse(b.createdAt ?? "");
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return 0;
      }
      return right - left;
    });
    return sorted.slice(0, 4);
  }, [accounts]);

  const latestTransactions = useMemo(() => {
    if (payments.length === 0) {
      return [] as ServicePayment[];
    }
    const sorted = [...payments].sort((a, b) => {
      const left = Date.parse(a.paidAt ?? a.date ?? a.createdAt ?? "");
      const right = Date.parse(b.paidAt ?? b.date ?? b.createdAt ?? "");
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return 0;
      }
      return right - left;
    });
    return sorted.slice(0, 4);
  }, [payments]);

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
              Once the API responds, the overview table will appear here.
            </p>
          </div>
        </section>
      )}

      {kpis.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
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
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">Recent Users</h3>
            <Link
              href="/users"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#d68c45]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latestUsers.length === 0 ? (
            <p className="text-xs text-zinc-500">No user data yet.</p>
          ) : (
            <div className="space-y-3">
              {latestUsers.map((user, index) => {
                const name = getAccountName(user);
                const email = user.email ?? "-";
                const role = user.role ?? user.plan ?? "Account";
                const status = user.status ?? "active";
                const rowKey = user.id ?? user._id ?? `${name}-${index}`;
                return (
                  <div
                    key={rowKey}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{name}</p>
                      <p className="text-xs text-zinc-400">{email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">{role}</p>
                      <StatusBadge
                        label={status}
                        tone={String(status).toLowerCase() === "active" ? "success" : "warning"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold">Latest Transactions</h3>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#d68c45]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latestTransactions.length === 0 ? (
            <p className="text-xs text-zinc-500">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {latestTransactions.map((item, index) => {
                const customer = item.clientName ?? item.client ?? "Unknown";
                const service = item.serviceName ?? item.service ?? "Service";
                const amount = formatPaymentAmount(item.price ?? item.amount);
                const status = item.status ?? "pending";
                const rowKey = item.id ?? item._id ?? item.servicePaymentId ?? `${service}-${index}`;
                return (
                  <div
                    key={rowKey}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{customer}</p>
                      <p className="text-xs text-zinc-400">{service}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{amount}</p>
                      <StatusBadge label={String(status)} tone={getStatusTone(status)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

