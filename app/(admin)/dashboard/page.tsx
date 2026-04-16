"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import KpiCard from "@/components/admin/KpiCard";
import PageHero from "@/components/admin/PageHero";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi } from "@/lib/client-api";

type AccountRow = {
  id?: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  isBanned?: boolean | null;
  pointAmount?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AccountsPayload = {
  items?: AccountRow[];
  totalCount?: number;
};

type ServicePaymentRow = {
  servicePaymentId?: string;
  amount?: number | string | null;
  serviceType?: number | string | null;
  paymentDate?: string | null;
  status?: number | string | null;
  premiumId?: string | null;
  bookingId?: string | null;
  accountId?: string | null;
};

type TopupRow = {
  paymentId?: string;
  accountId?: string | null;
  amount?: number | string | null;
  status?: number | string | null;
  method?: number | string | null;
  orderCode?: number | string | null;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  expiredAt?: string | null;
  confirmedAt?: string | null;
  createdAt?: string | null;
};

type PremiumTypeRow = {
  id?: string;
  describe?: string | null;
  duration?: number | string | null;
  price?: number | string | null;
  status?: number | string | null;
};

type ConversionRateRow = {
  id?: string;
  type?: number | string | null;
  rate?: number | string | null;
  status?: number | string | null;
};

type BookingRow = Record<string, unknown>;

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

function formatPoints(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)} P`;
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

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function findArray<T>(value: unknown, depth = 0): T[] | null {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findArray<T>(entry, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function extractAccounts(payload: unknown): AccountRow[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as { data?: AccountsPayload };
  return record.data?.items ?? [];
}

function extractServicePayments(payload: unknown): ServicePaymentRow[] {
  return findArray<ServicePaymentRow>(payload) ?? [];
}

function extractTopups(payload: unknown): TopupRow[] {
  return findArray<TopupRow>(payload) ?? [];
}

function extractPremiumTypes(payload: unknown): PremiumTypeRow[] {
  return findArray<PremiumTypeRow>(payload) ?? [];
}

function extractConversionRates(payload: unknown): ConversionRateRow[] {
  return findArray<ConversionRateRow>(payload) ?? [];
}

function extractBookings(payload: unknown): BookingRow[] {
  return findArray<BookingRow>(payload) ?? [];
}

function getAccountStatus(row: AccountRow) {
  if (row.isBanned) {
    return "Suspended";
  }
  if (typeof row.status === "string" && row.status.trim()) {
    return row.status;
  }
  return row.isActive ? "Active" : "Inactive";
}

function getAccountName(row: AccountRow) {
  const email = row.email ?? "";
  if (!email) {
    return row.id ?? "Unknown";
  }
  return email.includes("@") ? email.split("@")[0] : email;
}

function getTopupTimeline(row: TopupRow) {
  return row.paidAt ?? row.confirmedAt ?? row.createdAt ?? row.expiredAt ?? null;
}

function isWithinCurrentMonth(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const start = getStartOfMonth();
  const end = new Date();
  return parsed >= start && parsed <= end;
}

function getTopupStatusLabel(status: number) {
  return status === 1 ? "Paid" : "Failed";
}

function getTopupStatusTone(status: number) {
  return status === 1 ? "success" : "warning";
}

function getServiceTypeLabel(serviceType: number) {
  return serviceType === 1 ? "Premium" : "BookingPT";
}

function getServicePaymentStatusTone(status: number) {
  if (status === 1) {
    return "success";
  }
  if (status === 3) {
    return "warning";
  }
  return "neutral";
}

function getConversionLabel(type: number) {
  return type === 1 ? "Topup" : type === 2 ? "Withdraw" : `Type ${type}`;
}

function getConversionStatusLabel(status: number) {
  return status === 0 ? "On" : "Off";
}

function getConversionStatusTone(status: number) {
  return status === 0 ? "success" : "warning";
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
    <article className="admin-surface rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">Revenue Graph</h3>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Paid topups from {toDateInputValue(getStartOfMonth())} to {toDateInputValue(new Date())}.
          </p>
        </div>
        <StatusBadge label="Payment History Only" tone="success" />
      </div>

      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/12 text-sm text-[var(--admin-muted)]">
          No paid topup revenue in the current month.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
              <defs>
                <linearGradient id="dashboard-revenue-area" x1="0" x2="0" y1="0" y2="1">
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

              {areaPath ? <path d={areaPath} fill="url(#dashboard-revenue-area)" /> : null}
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
    </article>
  );
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [servicePayments, setServicePayments] = useState<ServicePaymentRow[]>([]);
  const [topups, setTopups] = useState<TopupRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [premiumTypes, setPremiumTypes] = useState<PremiumTypeRow[]>([]);
  const [conversionRates, setConversionRates] = useState<ConversionRateRow[]>([]);

  useEffect(() => {
    let active = true;

    clientApi.get<unknown>("/api/admin/accounts?Page=1&PageSize=100").then((result) => {
      if (!active || result.error) {
        return;
      }
      setAccounts(extractAccounts(result.data));
    });

    clientApi.get<unknown>("/api/service-payments/admin/all").then((result) => {
      if (!active || result.error) {
        return;
      }
      setServicePayments(extractServicePayments(result.data));
    });

    clientApi.get<unknown>("/api/topups/admin/all").then((result) => {
      if (!active || result.error) {
        return;
      }
      setTopups(extractTopups(result.data));
    });

    clientApi.get<unknown>("/api/Booking/admin/bookings").then((result) => {
      if (!active || result.error) {
        return;
      }
      setBookings(extractBookings(result.data));
    });

    clientApi.get<unknown>("/api/premium/admin/types").then((result) => {
      if (!active || result.error) {
        return;
      }
      setPremiumTypes(extractPremiumTypes(result.data));
    });

    clientApi.get<unknown>("/api/conversion-rates").then((result) => {
      if (!active || result.error) {
        return;
      }
      setConversionRates(extractConversionRates(result.data));
    });

    return () => {
      active = false;
    };
  }, []);

  const activeAccounts = useMemo(
    () => accounts.filter((row) => getAccountStatus(row).toLowerCase() === "active").length,
    [accounts]
  );
  const suspendedAccounts = useMemo(
    () => accounts.filter((row) => getAccountStatus(row).toLowerCase() === "suspended").length,
    [accounts]
  );
  const paidTopups = useMemo(() => topups.filter((row) => toNumber(row.status) === 1), [topups]);
  const monthlyPaidTopups = useMemo(
    () => paidTopups.filter((row) => isWithinCurrentMonth(getTopupTimeline(row))),
    [paidTopups]
  );
  const monthlyRevenue = useMemo(
    () => monthlyPaidTopups.reduce((sum, row) => sum + toNumber(row.amount), 0),
    [monthlyPaidTopups]
  );

  const premiumRegisteredUsers = useMemo(
    () =>
      new Set(
        servicePayments
          .filter((row) => toNumber(row.serviceType) === 1 && toNumber(row.status) === 1 && row.accountId)
          .map((row) => row.accountId)
      ).size,
    [servicePayments]
  );
  const activePremiumTypes = useMemo(
    () => premiumTypes.filter((row) => toNumber(row.status) === 0).length,
    [premiumTypes]
  );
  const onConversionRates = useMemo(
    () => conversionRates.filter((row) => toNumber(row.status) === 0).length,
    [conversionRates]
  );

  const kpis = [
    {
      title: "Accounts",
      value: String(accounts.length),
      delta: `Active: ${activeAccounts}`,
      trend: "up" as const,
      icon: "users" as const,
    },
    {
      title: "Premium Users",
      value: String(premiumRegisteredUsers),
      delta: `Premium active: ${activePremiumTypes}`,
      trend: premiumRegisteredUsers > 0 ? ("up" as const) : ("down" as const),
      icon: "users" as const,
    },
    {
      title: "Payment History",
      value: String(topups.length),
      delta: `Paid: ${paidTopups.length}`,
      trend: paidTopups.length > 0 ? ("up" as const) : ("down" as const),
      icon: "activity" as const,
    },
    {
      title: "PT Bookings",
      value: String(bookings.length),
      delta: `Premium active: ${activePremiumTypes}`,
      trend: bookings.length > 0 ? ("up" as const) : ("down" as const),
      icon: "calendar" as const,
    },
  ];

  const revenueChartData = useMemo(() => {
    const grouped = new Map<string, number>();

    monthlyPaidTopups.forEach((row) => {
      const timeline = getTopupTimeline(row);
      if (!timeline) {
        return;
      }

      const parsed = new Date(timeline);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      const key = toDateInputValue(parsed);
      grouped.set(key, (grouped.get(key) ?? 0) + toNumber(row.amount));
    });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        label: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(key)),
        value,
      }));
  }, [monthlyPaidTopups]);

  const recentAccounts = useMemo(() => {
    return [...accounts]
      .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
      .slice(0, 4);
  }, [accounts]);

  const latestTopups = useMemo(() => {
    return [...topups]
      .sort((a, b) => Date.parse(getTopupTimeline(b) ?? "") - Date.parse(getTopupTimeline(a) ?? ""))
      .slice(0, 4);
  }, [topups]);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="FITUP Admin"
        title="Operations Overview"
        description="Live dashboard powered by the current admin APIs. Revenue and payment count use Payment History, with premium users as membership signal."
        stats={[
          { label: "Accounts", value: String(accounts.length), tone: "info" },
          { label: "Bookings", value: String(bookings.length), tone: "success" },
          { label: "Topup Revenue", value: formatVnd(monthlyRevenue), tone: "warning" },
          { label: "Premium Users", value: String(premiumRegisteredUsers), tone: "accent" },
        ]}
      />

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

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <RevenueChart data={revenueChartData} />

        <article className="admin-surface rounded-3xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-white">Platform Snapshot</h3>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Quick status across current payment and configuration APIs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="admin-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Payment History Revenue</p>
              <p className="mt-2 text-2xl font-black text-[#ffe2a3]">{formatVnd(monthlyRevenue)}</p>
              <p className="mt-1 text-sm text-[var(--admin-soft)]">{monthlyPaidTopups.length} paid topups this month</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="admin-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Premium Users</p>
                <p className="mt-2 text-lg font-bold text-white">{premiumRegisteredUsers}</p>
              </div>
              <div className="admin-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Conversion Rates On</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {onConversionRates}/{conversionRates.length || 2}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {conversionRates.map((row) => (
                <div key={row.id ?? String(row.type)} className="admin-panel rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{getConversionLabel(toNumber(row.type))}</p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        Rate {(toNumber(row.rate) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <StatusBadge
                      label={getConversionStatusLabel(toNumber(row.status))}
                      tone={getConversionStatusTone(toNumber(row.status))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="admin-surface rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Recent Users</h3>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">Newest accounts from the admin API.</p>
            </div>
            <Link
              href="/users"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffe2a3]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAccounts.map((user) => (
              <div key={user.id ?? user.email} className="admin-panel rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{getAccountName(user)}</p>
                    <p className="text-sm text-[var(--admin-muted)]">{user.email ?? "-"}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge label={getAccountStatus(user)} tone={getTopupStatusTone(getAccountStatus(user).toLowerCase() === "active" ? 1 : 3)} />
                    <p className="mt-2 text-xs text-[var(--admin-muted)]">{formatPoints(toNumber(user.pointAmount))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-surface rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Latest Topups</h3>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">Recent payment history activity.</p>
            </div>
            <Link
              href="/payment-history"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffe2a3]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {latestTopups.map((item) => (
              <div key={item.paymentId ?? item.orderCode} className="admin-panel rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{formatVnd(toNumber(item.amount))}</p>
                    <p className="text-sm text-[var(--admin-muted)]">{formatDate(getTopupTimeline(item))}</p>
                  </div>
                  <StatusBadge
                    label={getTopupStatusLabel(toNumber(item.status))}
                    tone={getTopupStatusTone(toNumber(item.status))}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-surface rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Service Payment Mix</h3>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">Latest premium and PT payment activity.</p>
            </div>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffe2a3]"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[...servicePayments]
              .sort((a, b) => Date.parse(b.paymentDate ?? "") - Date.parse(a.paymentDate ?? ""))
              .slice(0, 4)
              .map((item) => (
                <div key={item.servicePaymentId ?? `${item.accountId}-${item.paymentDate}`} className="admin-panel rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{getServiceTypeLabel(toNumber(item.serviceType))}</p>
                      <p className="text-sm text-[var(--admin-muted)]">{formatPoints(toNumber(item.amount))}</p>
                    </div>
                    <StatusBadge
                      label={`Status ${toNumber(item.status)}`}
                      tone={getServicePaymentStatusTone(toNumber(item.status))}
                    />
                  </div>
                </div>
              ))}
          </div>
        </article>
      </section>
    </div>
  );
}
