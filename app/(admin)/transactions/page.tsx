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

type ServicePaymentApiRow = {
  servicePaymentId?: string;
  amount?: number | string | null;
  serviceType?: number | string | null;
  paymentDate?: string | null;
  status?: number | string | null;
  premiumId?: string | null;
  bookingId?: string | null;
  accountId?: string | null;
};

type ServicePaymentRow = {
  id: string;
  accountId: string;
  accountName: string;
  amount: number;
  serviceType: number;
  serviceLabel: string;
  paymentDate: string;
  status: number;
  premiumId: string | null;
  bookingId: string | null;
};

type AccountRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
};

type PremiumTypeRecord = {
  id?: string;
  describe?: string | null;
};

type PremiumPaymentDetail = {
  premiumPaymentId?: string;
  price?: number | string | null;
  premiumId?: string | null;
  premiumTypeId?: string | null;
  accountId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  premiumStatus?: number | string | null;
};

type BookingPaymentDetail = {
  bookingPaymentId?: string;
  price?: number | string | null;
  bookingId?: string | null;
  accountId?: string | null;
  slotForBookingId?: string | null;
  total?: number | string | null;
  note?: string | null;
  bookingStatus?: number | string | null;
};

type ServicePaymentDetail = {
  servicePaymentId?: string;
  amount?: number | string | null;
  serviceType?: number | string | null;
  paymentDate?: string | null;
  status?: number | string | null;
  premiumPaymentDetail?: PremiumPaymentDetail | null;
  bookingPaymentDetail?: BookingPaymentDetail | null;
};

type DetailModalState = {
  open: boolean;
  loading: boolean;
  error: string | null;
  row: ServicePaymentRow | null;
  detail: ServicePaymentDetail | null;
};

const PAGE_SIZE = 6;

function findArray(value: unknown, depth = 0): ServicePaymentApiRow[] | null {
  if (Array.isArray(value)) {
    return value as ServicePaymentApiRow[];
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

function findPremiumTypeArray(value: unknown, depth = 0): PremiumTypeRecord[] | null {
  if (Array.isArray(value)) {
    return value as PremiumTypeRecord[];
  }

  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findPremiumTypeArray(entry, depth + 1);
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

function getServiceTypeLabel(serviceType: number) {
  return serviceType === 1 ? "Premium" : "BookingPT";
}

function getServiceTypeStyles(serviceType: number) {
  return serviceType === 1
    ? {
        badge: "border-violet-400/30 bg-violet-400/12 text-violet-100",
        accent: "text-violet-200",
        panel: "border-violet-400/20 bg-violet-400/8",
      }
    : {
        badge: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
        accent: "text-cyan-100",
        panel: "border-cyan-400/20 bg-cyan-400/8",
      };
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

function formatPoints(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)} P`;
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

function extractAccounts(payload: unknown): AccountRecord[] {
  return findAccountArray(payload) ?? [];
}

function extractPremiumTypes(payload: unknown): PremiumTypeRecord[] {
  return findPremiumTypeArray(payload) ?? [];
}

function normalizeRows(payload: unknown, accountMap: Record<string, string>) {
  const rows = findArray(payload) ?? [];

  return rows
    .map((row) => {
      const id = typeof row.servicePaymentId === "string" ? row.servicePaymentId : "";
      const accountId = typeof row.accountId === "string" ? row.accountId : "";
      const serviceType = toNumber(row.serviceType);
      const amount = toNumber(row.amount);
      const status = toNumber(row.status);

      return {
        id,
        accountId,
        accountName: accountMap[accountId] ?? accountId ?? "Unknown",
        amount,
        serviceType,
        serviceLabel: getServiceTypeLabel(serviceType),
        paymentDate: row.paymentDate ?? "-",
        status,
        premiumId: typeof row.premiumId === "string" ? row.premiumId : null,
        bookingId: typeof row.bookingId === "string" ? row.bookingId : null,
      } satisfies ServicePaymentRow;
    })
    .filter((row) => row.id);
}

function extractDetail(payload: unknown): ServicePaymentDetail | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return record.data as ServicePaymentDetail;
  }

  return record as ServicePaymentDetail;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-white">{value || "-"}</p>
    </div>
  );
}

export default function TransactionsPage() {
  const [rows, setRows] = useState<ServicePaymentRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [listResult, setListResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [premiumTypeMap, setPremiumTypeMap] = useState<Record<string, string>>({});
  const { debouncedQuery: globalQuery } = useAdminSearch();
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    loading: false,
    error: null,
    row: null,
    detail: null,
  });

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

    clientApi.get<unknown>("/api/premium/admin/types").then((result) => {
      if (!active || result.error) {
        return;
      }

      const premiumTypes = extractPremiumTypes(result.data);
      const nextMap: Record<string, string> = {};
      for (const premiumType of premiumTypes) {
        if (premiumType.id) {
          nextMap[premiumType.id] = premiumType.describe?.trim() || premiumType.id;
        }
      }
      setPremiumTypeMap(nextMap);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    clientApi.get<unknown>("/api/service-payments/admin/all").then((result) => {
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

  const totals = useMemo(() => {
    const paid = rows.filter((item) => item.status === 1).length;
    const failed = rows.filter((item) => item.status === 3).length;
    const bookingPtTransactions = rows.filter((item) => item.serviceType !== 1).length;
    const premiumAccounts = new Set(
      rows
        .filter((item) => item.serviceType === 1 && item.status === 1 && item.accountId)
        .map((item) => item.accountId)
    ).size;
    return { paid, failed, bookingPtTransactions, premiumAccounts };
  }, [rows]);

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "all" || String(row.status) === statusFilter;
      const matchesService = serviceFilter === "all" || String(row.serviceType) === serviceFilter;
      const searchPayload = {
        ...row,
        amountFormatted: formatPoints(row.amount),
        paymentDateFormatted: formatDate(row.paymentDate),
        statusLabel: getStatusLabel(row.status),
      };

      return matchesStatus && matchesService && matchesSearch(searchPayload, combinedQuery);
    });
  }, [combinedQuery, rows, serviceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openDetail = async (row: ServicePaymentRow) => {
    setDetailModal({
      open: true,
      loading: true,
      error: null,
      row,
      detail: null,
    });

    const result = await clientApi.get<unknown>(`/api/service-payments/admin/${row.id}`);
    if (result.error) {
      setDetailModal({
        open: true,
        loading: false,
        error: result.error,
        row,
        detail: null,
      });
      return;
    }

    setDetailModal({
      open: true,
      loading: false,
      error: null,
      row,
      detail: extractDetail(result.data),
    });
  };

  const closeDetail = () => {
    setDetailModal({
      open: false,
      loading: false,
      error: null,
      row: null,
      detail: null,
    });
  };

  const premiumDetail = detailModal.detail?.premiumPaymentDetail ?? null;
  const bookingDetail = detailModal.detail?.bookingPaymentDetail ?? null;
  const premiumTypeLabel =
    premiumDetail?.premiumTypeId ? premiumTypeMap[premiumDetail.premiumTypeId] ?? premiumDetail.premiumTypeId : "-";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Finance Activity"
        title="Service Payment"
        description="Track all service payments from the admin API and inspect details differently for Premium and BookingPT records."
        stats={[
          { label: "Payments", value: String(rows.length), tone: "info" },
          { label: "Paid", value: String(totals.paid), tone: "success" },
          { label: "Failed", value: String(totals.failed), tone: "warning" },
          { label: "BookingPT Tx", value: String(totals.bookingPtTransactions), tone: "info" },
          { label: "Premium Accounts", value: String(totals.premiumAccounts), tone: "accent" },
        ]}
      />

      <section className="admin-surface rounded-3xl p-6 md:p-7">
        <PageToolbar
          className="mb-5"
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search account, payment ID, booking, premium, or amount"
          resultLabel={`Showing ${pageRows.length} of ${filteredRows.length} service payments`}
          filters={[
            {
              label: "Service Type",
              value: serviceFilter,
              onChange: (value) => {
                setServiceFilter(value);
                setPage(1);
              },
              options: [
                { label: "All service types", value: "all" },
                { label: "BookingPT", value: "0" },
                { label: "Premium", value: "1" },
              ],
            },
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                <th className="pb-3 pr-4 font-semibold">Account</th>
                <th className="pb-3 pr-4 font-semibold">Service Type</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Payment Date</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Reference</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((item) => (
                <tr key={item.id} className="border-b border-white/8 text-[var(--admin-soft)]">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-white">{item.accountName || "Unknown"}</p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">{item.accountId}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                        getServiceTypeStyles(item.serviceType).badge
                      }`}
                    >
                      {item.serviceLabel}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-[#ffe2a3]">{formatPoints(item.amount)}</td>
                  <td className="py-4 pr-4">{formatDate(item.paymentDate)}</td>
                  <td className="py-4 pr-4">
                    <StatusBadge label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />
                  </td>
                  <td className="py-4 pr-4 text-xs text-[var(--admin-muted)]">
                    {item.serviceType === 1 ? item.premiumId ?? "-" : item.bookingId ?? "-"}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void openDetail(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:border-[#f0b35b]/50 hover:text-[#ffe2a3]"
                      aria-label={`View service payment ${item.id}`}
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

      {detailModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface w-full max-w-4xl rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-extrabold text-white">Service Payment Detail</h4>
                {detailModal.row ? (
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {detailModal.row.serviceLabel} • {detailModal.row.id}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailModal.loading ? (
              <p className="text-sm text-[var(--admin-muted)]">Loading payment detail...</p>
            ) : null}
            {detailModal.error ? <p className="text-sm text-rose-300">{detailModal.error}</p> : null}

            {!detailModal.loading && !detailModal.error && detailModal.detail ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="Service Payment ID" value={detailModal.detail.servicePaymentId ?? "-"} />
                  <DetailItem
                    label="Amount"
                    value={formatPoints(toNumber(detailModal.detail.amount))}
                  />
                  <DetailItem
                    label="Service Type"
                    value={getServiceTypeLabel(toNumber(detailModal.detail.serviceType))}
                  />
                  <DetailItem
                    label="Payment Date"
                    value={formatDate(detailModal.detail.paymentDate)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className={`admin-panel rounded-3xl border p-5 ${
                      detailModal.detail.serviceType !== undefined
                        ? getServiceTypeStyles(toNumber(detailModal.detail.serviceType)).panel
                        : ""
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="text-base font-bold text-white">Payment Status</h5>
                      <StatusBadge
                        label={getStatusLabel(toNumber(detailModal.detail.status))}
                        tone={getStatusTone(toNumber(detailModal.detail.status))}
                      />
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        getServiceTypeStyles(toNumber(detailModal.detail.serviceType)).accent
                      }`}
                    >
                      {toNumber(detailModal.detail.serviceType) === 1
                        ? "Premium purchase"
                        : "PT booking payment"}
                    </p>
                  </div>

                  {premiumDetail ? (
                    <div className="admin-panel rounded-3xl border border-violet-400/20 bg-violet-400/8 p-5">
                      <h5 className="mb-4 text-base font-bold text-white">Premium Detail</h5>
                      <div className="grid gap-3">
                        <DetailItem label="Premium Payment ID" value={premiumDetail.premiumPaymentId ?? "-"} />
                        <DetailItem label="Premium Type" value={premiumTypeLabel} />
                        <DetailItem label="Start Date" value={formatDate(premiumDetail.startDate)} />
                        <DetailItem label="End Date" value={formatDate(premiumDetail.endDate)} />
                        <DetailItem label="Premium Status" value={String(premiumDetail.premiumStatus ?? "-")} />
                      </div>
                    </div>
                  ) : null}

                  {bookingDetail ? (
                    <div className="admin-panel rounded-3xl border border-cyan-400/20 bg-cyan-400/8 p-5 md:col-span-2">
                      <h5 className="mb-4 text-base font-bold text-white">BookingPT Detail</h5>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <DetailItem label="Booking Payment ID" value={bookingDetail.bookingPaymentId ?? "-"} />
                        <DetailItem label="Booking ID" value={bookingDetail.bookingId ?? "-"} />
                        <DetailItem label="Account ID" value={bookingDetail.accountId ?? "-"} />
                        <DetailItem label="Slot For Booking ID" value={bookingDetail.slotForBookingId ?? "-"} />
                        <DetailItem label="Price" value={formatPoints(toNumber(bookingDetail.price))} />
                        <DetailItem label="Total" value={formatPoints(toNumber(bookingDetail.total))} />
                        <DetailItem label="Note" value={bookingDetail.note ?? "-"} />
                        <DetailItem label="Booking Status" value={String(bookingDetail.bookingStatus ?? "-")} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
