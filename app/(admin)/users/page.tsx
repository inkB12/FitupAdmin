"use client";

import { Ban, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { clientApi, type ApiResult } from "@/lib/client-api";

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
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

const PAGE_SIZE = 10;

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

function normalizeRole(role: string | null | undefined) {
  if (!role) {
    return "User";
  }

  const lowered = role.toLowerCase();
  if (lowered === "pt") {
    return "PT";
  }
  if (lowered === "admin") {
    return "Admin";
  }
  if (lowered === "user") {
    return "User";
  }

  return role;
}

function normalizeStatus(row: AccountRow) {
  if (row.isBanned) {
    return "Suspended";
  }
  if (typeof row.status === "string" && row.status.trim()) {
    return row.status;
  }
  return row.isActive ? "Active" : "Inactive";
}

function getStatusTone(status: string) {
  const lowered = status.toLowerCase();
  if (lowered === "active") {
    return "success";
  }
  if (lowered === "suspended" || lowered === "banned") {
    return "warning";
  }
  return "neutral";
}

function getRoleTone(role: string) {
  const lowered = role.toLowerCase();
  if (lowered === "admin") {
    return "border-amber-400/30 bg-amber-400/12 text-amber-100";
  }
  if (lowered === "pt") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  }
  return "border-sky-400/30 bg-sky-400/10 text-sky-100";
}

function extractPayload(value: unknown): AccountsPayload {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as { data?: AccountsPayload };
  return record.data ?? {};
}

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getRoleTone(role)}`}
    >
      {role}
    </span>
  );
}

export default function UsersPage() {
  const [accountsResult, setAccountsResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim(),
    [globalQuery, query]
  );

  const loadAccounts = useCallback(() => {
    const params = new URLSearchParams();

    if (combinedQuery) {
      params.set("Search", combinedQuery);
    }
    if (statusFilter !== "all") {
      params.set("Status", statusFilter);
    }
    if (roleFilter !== "all") {
      params.set("Role", roleFilter);
    }

    params.set("Page", String(page));
    params.set("PageSize", String(PAGE_SIZE));

    clientApi.get<unknown>(`/api/admin/accounts?${params.toString()}`).then((result) => {
      setAccountsResult(result);
    });
  }, [combinedQuery, page, roleFilter, statusFilter]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const payload = useMemo(() => extractPayload(accountsResult.data), [accountsResult.data]);
  const rows = useMemo(() => payload.items ?? [], [payload.items]);
  const totalCount = payload.totalCount ?? rows.length;
  const totalPages = Math.max(1, payload.totalPages ?? 1);
  const currentPage = payload.page ?? page;

  const activeCount = useMemo(
    () => rows.filter((row) => normalizeStatus(row).toLowerCase() === "active").length,
    [rows]
  );
  const suspendedCount = useMemo(
    () => rows.filter((row) => normalizeStatus(row).toLowerCase() === "suspended").length,
    [rows]
  );
  const totalPoints = useMemo(
    () => rows.reduce((sum, row) => sum + toNumber(row.pointAmount), 0),
    [rows]
  );

  const updateBanState = async (row: AccountRow, nextAction: "ban" | "unban") => {
    if (!row.id || pendingId) {
      return;
    }

    const email = row.email ?? row.id;
    const confirmed = window.confirm(
      nextAction === "ban" ? `Ban account ${email}?` : `Unban account ${email}?`
    );

    if (!confirmed) {
      return;
    }

    setPendingId(row.id);
    const result = await clientApi.patch(
      `/api/admin/accounts/${row.id}/${nextAction === "ban" ? "ban" : "unban"}`
    );
    setPendingId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    loadAccounts();
  };

  return (
    <section className="space-y-6">
      <PageHero
        eyebrow="Account Oversight"
        title="Users Management"
        description="Manage accounts from the admin API with server-side search, role and status filters, clear point balances, and direct ban or unban actions."
        stats={[
          { label: "Accounts", value: String(totalCount), tone: "info" },
          { label: "Active", value: String(activeCount), tone: "success" },
          { label: "Suspended", value: String(suspendedCount), tone: "warning" },
          { label: "Points", value: formatPoints(totalPoints), tone: "accent" },
        ]}
      />

      <div className="admin-surface rounded-3xl p-6 md:p-7">
        <PageToolbar
          className="mb-5"
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search by email, phone, account ID, or role"
          resultLabel={`Showing ${rows.length} of ${totalCount} accounts`}
          filters={[
            {
              label: "Role",
              value: roleFilter,
              onChange: (value) => {
                setRoleFilter(value);
                setPage(1);
              },
              options: [
                { label: "All roles", value: "all" },
                { label: "User", value: "User" },
                { label: "PT", value: "PT" },
                { label: "Admin", value: "Admin" },
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
                { label: "Active", value: "Active" },
                { label: "Suspended", value: "Suspended" },
                { label: "Inactive", value: "Inactive" },
              ],
            },
          ]}
        />

        {accountsResult.error ? <p className="mb-4 text-sm text-rose-300">{accountsResult.error}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                <th className="pb-3 pr-4 font-semibold">Account</th>
                <th className="pb-3 pr-4 font-semibold">Contact</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Point</th>
                <th className="pb-3 pr-4 font-semibold">Created</th>
                <th className="pb-3 pr-4 font-semibold">Updated</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => {
                const email = user.email ?? "-";
                const role = normalizeRole(user.role);
                const status = normalizeStatus(user);
                const points = toNumber(user.pointAmount);
                const isBanned = Boolean(user.isBanned) || status.toLowerCase() === "suspended";
                const isPending = pendingId === user.id;

                return (
                  <tr key={user.id ?? email} className="border-b border-white/8 text-[var(--admin-soft)]">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--admin-soft)]">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{email}</p>
                          <p className="text-xs text-[var(--admin-muted)]">{user.id ?? "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1 text-xs text-[var(--admin-muted)]">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-[#f0b35b]" />
                          {email}
                        </span>
                        <span>{user.phone ?? "-"}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <RolePill role={role} />
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge label={status} tone={getStatusTone(status)} />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="inline-flex min-w-[116px] rounded-2xl border border-[#f0b35b]/25 bg-[#f0b35b]/10 px-4 py-2 text-sm font-extrabold text-[#ffe2a3]">
                        {formatPoints(points)}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-xs text-[var(--admin-muted)]">{formatDate(user.createdAt)}</td>
                    <td className="py-4 pr-4 text-xs text-[var(--admin-muted)]">{formatDate(user.updatedAt)}</td>
                    <td className="py-4 text-right">
                      {isBanned ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void updateBanState(user, "unban")}
                          className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/14 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:border-emerald-300/50 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {isPending ? "Working..." : "Unban"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void updateBanState(user, "ban")}
                          className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-full border border-rose-400/35 bg-rose-400/12 px-4 py-2 text-xs font-semibold text-rose-100 transition-colors hover:border-rose-300/50 hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {isPending ? "Working..." : "Ban"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Page ${currentPage} of ${totalPages}`}
        />
      </div>
    </section>
  );
}
