"use client";

import { Eye, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { matchesSearch } from "@/lib/admin-ui";
import { clientApi, type ApiResult } from "@/lib/client-api";

type TopupApiRow = {
  paymentId?: string;
  accountId?: string | null;
  amount?: number | string | null;
  status?: number | string | null;
  orderCode?: number | string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  createdAt?: string | null;
};

type TopupRow = {
  paymentId: string;
  accountId: string;
  accountName: string;
  amount: number;
  status: number;
  orderCode: string;
  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string | null;
};

type AccountRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
};

type DetailState = {
  open: boolean;
  row: TopupRow | null;
};

const PAGE_SIZE = 6;

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const now = new Date();
  return {
    from: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInputValue(now),
  };
}

function findArray(value: unknown, depth = 0): TopupApiRow[] | null {
  if (Array.isArray(value)) {
    return value as TopupApiRow[];
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

function findAccountArray(value: unknown, depth = 0): AccountRecord[] | null {
  if (Array.isArray(value)) {
    return value as AccountRecord[];
  }

  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findAccountArray(entry, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function getAccountId(account: AccountRecord) {
  if (typeof account.id === "string") {
    return account.id;
  }
  if (typeof account._id === "string") {
    return account._id;
  }
  return "";
}

function getAccountName(account: AccountRecord) {
  const email = account.email ?? "";

  if (account.name) {
    return account.name;
  }
  if (account.fullName) {
    return account.fullName;
  }
  if (account.username) {
    return account.username;
  }
  if (email) {
    return email.includes("@") ? email.split("@")[0] : email;
  }

  return "Unknown";
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getTimelineDate(row: TopupRow) {
  return row.paidAt ?? row.confirmedAt ?? row.createdAt;
}

function isWithinRange(value: string | null | undefined, from: string, to: string) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59.999`);
  return parsed >= fromDate && parsed <= toDate;
}

function getStatusTone(status: number) {
  if (status === 1) {
    return "success";
  }
  if (status === 3) {
    return "warning";
  }
  return "neutral";
}

function getStatusLabel(status: number) {
  if (status === 1) {
    return "Paid";
  }
  if (status === 3) {
    return "Failed";
  }
  return `Status ${status}`;
}

function extractAccounts(payload: unknown): AccountRecord[] {
  return findAccountArray(payload) ?? [];
}

function normalizeRows(payload: unknown, accountMap: Record<string, string>) {
  const rows = findArray(payload) ?? [];

  return rows
    .map((row) => {
      const paymentId = typeof row.paymentId === "string" ? row.paymentId : "";
      const accountId = typeof row.accountId === "string" ? row.accountId : "";

      return {
        paymentId,
        accountId,
        accountName: accountMap[accountId] ?? accountId ?? "Unknown",
        amount: toNumber(row.amount),
        status: toNumber(row.status),
        orderCode: row.orderCode !== undefined && row.orderCode !== null ? String(row.orderCode) : "-",
        paidAt: row.paidAt ?? null,
        confirmedAt: row.confirmedAt ?? null,
        createdAt: row.createdAt ?? null,
      } satisfies TopupRow;
    })
    .filter((row) => row.paymentId);
}

function DetailItem({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "rounded-2xl border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.15),rgba(255,255,255,0.04))] p-5"
          : "admin-panel rounded-2xl p-4"
      }
    >
      <p
        className={
          emphasis
            ? "text-xs uppercase tracking-[0.12em] text-[#ffd99b]"
            : "text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]"
        }
      >
        {label}
      </p>
      <p className={emphasis ? "mt-3 break-all text-lg font-black text-white" : "mt-2 break-all text-sm font-semibold text-white"}>
        {value || "-"}
      </p>
    </div>
  );
}

function RevenueChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const width = 760;
  const height = 220;
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 34;
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
    const y =
      height - paddingBottom - (item.value / maxValue) * (height - paddingTop - paddingBottom);

    return { ...item, x, y };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  return (
    <div className="admin-surface rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Revenue Trend</p>
          <h3 className="mt-1 text-lg font-bold text-white">Paid Topups Over Time</h3>
        </div>
        <p className="text-xs text-[var(--admin-muted)]">Grouped by day</p>
      </div>

      {data.length === 0 || data.every((item) => item.value === 0) ? (
        <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/12 text-sm text-[var(--admin-muted)]">
          No paid revenue in the selected range.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
              <defs>
                <linearGradient id="payment-history-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f0b35b" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#f0b35b" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              <line
                x1={paddingX}
                y1={height - paddingBottom}
                x2={width - paddingX}
                y2={height - paddingBottom}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
              />

              {areaPath ? <path d={areaPath} fill="url(#payment-history-area)" /> : null}
              <path
                d={linePath}
                fill="none"
                stroke="#f0b35b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4.5" fill="#ffe2a3" />
                  <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.84)">
                    {new Intl.NumberFormat("en-US", { notation: "compact" }).format(point.value)}
                  </text>
                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgba(142,163,184,0.88)"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            {data.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--admin-muted)]">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-[#ffe2a3]">{formatVnd(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentHistoryPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [rows, setRows] = useState<TopupRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [page, setPage] = useState(1);
  const [listResult, setListResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [detailState, setDetailState] = useState<DetailState>({ open: false, row: null });
  const { debouncedQuery: globalQuery } = useAdminSearch();

  useEffect(() => {
    let active = true;

    clientApi.get<unknown>("/api/admin/accounts").then((result) => {
      if (!active || result.error) {
        return;
      }

      const accounts = extractAccounts(result.data);
      const nextMap: Record<string, string> = {};
      for (const account of accounts) {
        const id = getAccountId(account);
        if (id) {
          nextMap[id] = getAccountName(account);
        }
      }
      setAccountMap(nextMap);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    clientApi.get<unknown>("/api/topups/admin/all").then((result) => {
      if (!active) {
        return;
      }
      setListResult(result);
      setRows(normalizeRows(result.data, accountMap));
    });

    return () => {
      active = false;
    };
  }, [accountMap]);

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "all" || String(row.status) === statusFilter;
      const timelineDate = getTimelineDate(row);
      const matchesDate = isWithinRange(timelineDate, dateFrom, dateTo);
      const searchPayload = {
        ...row,
        amountFormatted: formatVnd(row.amount),
        statusLabel: getStatusLabel(row.status),
        paidAtFormatted: formatDate(row.paidAt),
        timelineDateFormatted: formatDate(timelineDate),
      };

      return matchesStatus && matchesDate && matchesSearch(searchPayload, combinedQuery);
    });
  }, [combinedQuery, dateFrom, dateTo, rows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const paidCount = useMemo(() => rows.filter((row) => row.status === 1).length, [rows]);
  const failedCount = useMemo(() => rows.filter((row) => row.status === 3).length, [rows]);
  const paidRowsInRange = useMemo(() => filteredRows.filter((row) => row.status === 1), [filteredRows]);
  const paidRevenue = useMemo(
    () => paidRowsInRange.reduce((sum, row) => sum + row.amount, 0),
    [paidRowsInRange]
  );
  const averagePaidRevenue = useMemo(
    () => Math.round(paidRevenue / Math.max(paidRowsInRange.length, 1)),
    [paidRevenue, paidRowsInRange.length]
  );

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    paidRowsInRange.forEach((row) => {
      const timelineDate = getTimelineDate(row);
      if (!timelineDate) {
        return;
      }

      const parsed = new Date(timelineDate);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      const key = toDateInputValue(parsed);
      grouped.set(key, (grouped.get(key) ?? 0) + row.amount);
    });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        label: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(key)),
        value,
      }));
  }, [paidRowsInRange]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Wallet Activity"
        title="Payment History"
        description="Review topup payment history from the admin API. This page uses VNĐ while service-related payments remain in P."
        stats={[
          { label: "Payments", value: String(rows.length), tone: "info" },
          { label: "Paid", value: String(paidCount), tone: "success" },
          { label: "Failed", value: String(failedCount), tone: "warning" },
          { label: "Revenue", value: formatVnd(paidRevenue), tone: "accent" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="admin-surface rounded-3xl p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Revenue Summary</p>
              <h3 className="mt-1 text-xl font-bold text-white">Paid Topup Revenue</h3>
            </div>
            <StatusBadge label="Paid Only" tone="success" />
          </div>

          <div className="rounded-3xl border border-[#f0b35b]/20 bg-[#f0b35b]/10 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#ffd99b]">Total Revenue</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[#ffe2a3]">{formatVnd(paidRevenue)}</p>
            <p className="mt-2 text-sm text-[var(--admin-soft)]">
              Counted from payments with status <span className="font-semibold text-white">Paid</span> in the selected
              time range.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              <span>From Date</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm font-medium normal-case tracking-normal text-white outline-none transition-colors focus:border-[#f0b35b]/80"
              />
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              <span>To Date</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm font-medium normal-case tracking-normal text-white outline-none transition-colors focus:border-[#f0b35b]/80"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="admin-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Range</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {dateFrom} to {dateTo}
              </p>
            </div>
            <div className="admin-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Paid Rows</p>
              <p className="mt-2 text-sm font-semibold text-white">{paidRowsInRange.length} payments</p>
            </div>
            <div className="admin-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Average Paid</p>
              <p className="mt-2 text-sm font-semibold text-white">{formatVnd(averagePaidRevenue)}</p>
            </div>
          </div>
        </div>

        <RevenueChart data={chartData} />
      </section>

      <section className="admin-surface rounded-3xl p-6 md:p-7">
        <PageToolbar
          className="mb-5"
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search payment ID, account, order code, or amount"
          resultLabel={`Showing ${pageRows.length} of ${filteredRows.length} payment history rows`}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setPage(1);
              },
              options: [
                { label: "All status", value: "all" },
                { label: "Paid", value: "1" },
                { label: "Failed", value: "3" },
              ],
            },
          ]}
        />

        {listResult.error ? <p className="mb-4 text-sm text-rose-300">{listResult.error}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                <th className="pb-3 pr-4 font-semibold">Account</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Order Code</th>
                <th className="pb-3 pr-4 font-semibold">Paid At</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.paymentId} className="border-b border-white/8 text-[var(--admin-soft)]">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-white">{row.accountName || "Unknown"}</p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">{row.accountId}</p>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-[#ffe2a3]">{formatVnd(row.amount)}</td>
                  <td className="py-4 pr-4">
                    <StatusBadge label={getStatusLabel(row.status)} tone={getStatusTone(row.status)} />
                  </td>
                  <td className="py-4 pr-4">{row.orderCode}</td>
                  <td className="py-4 pr-4">{formatDate(row.paidAt)}</td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailState({ open: true, row })}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:border-[#f0b35b]/50 hover:text-[#ffe2a3]"
                      aria-label={`View payment history ${row.paymentId}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Page ${currentPage} of ${totalPages}`}
        />
      </section>

      {detailState.open && detailState.row ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface w-full max-w-5xl rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-extrabold text-white">Payment History Detail</h4>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{detailState.row.paymentId}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailState({ open: false, row: null })}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <DetailItem label="Amount" value={formatVnd(detailState.row.amount)} emphasis />
              <DetailItem label="Status" value={getStatusLabel(detailState.row.status)} emphasis />
              <DetailItem label="Paid At" value={formatDate(detailState.row.paidAt)} emphasis />
              <DetailItem label="Order Code" value={detailState.row.orderCode} emphasis />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Payment ID" value={detailState.row.paymentId} />
              <DetailItem label="Account" value={detailState.row.accountName} />
              <DetailItem label="Created At" value={formatDate(detailState.row.createdAt)} />
              <DetailItem label="Confirmed At" value={formatDate(detailState.row.confirmedAt)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
