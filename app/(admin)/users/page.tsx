"use client";

import { Ban, Mail, Pencil, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi, type ApiResult } from "@/lib/client-api";
import { USERS } from "@/lib/admin-data";

type AccountRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
  role?: string;
  status?: string;
  phone?: string;
};

type ModalState = {
  open: boolean;
  row: AccountRecord | null;
  status: string;
};

const roleMap: Record<string, string> = {
  Basic: "Customer",
  Optimize: "Customer",
  Premium: "Staff",
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

function RolePill({ role }: { role: string }) {
  const tone = role.toLowerCase().includes("staff") || role.toLowerCase().includes("admin")
    ? "bg-amber-500/15 text-amber-200"
    : "bg-sky-500/15 text-sky-200";
  return (
    <span className={`rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${tone}`}>
      {role}
    </span>
  );
}

function findArray(value: unknown, depth = 0): AccountRecord[] | null {
  if (Array.isArray(value)) {
    return value as AccountRecord[];
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

function extractAccounts(payload: unknown): AccountRecord[] {
  const direct = findArray(payload);
  return direct ?? [];
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

export default function UsersPage() {
  const [accounts, setAccounts] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [modal, setModal] = useState<ModalState>({ open: false, row: null, status: "active" });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  const loadAccounts = useCallback(() => {
    clientApi.get<unknown>("/api/admin/accounts").then((result) => {
      setAccounts(result);
    });
  }, []);

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/admin/accounts").then((result) => {
      if (active) {
        setAccounts(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const accountRows: AccountRecord[] = useMemo(() => {
    const apiRows = extractAccounts(accounts.data);
    if (apiRows.length > 0) {
      return apiRows;
    }
    return USERS.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleMap[user.plan] ?? "Customer",
      status: user.status,
    }));
  }, [accounts.data]);

  const filteredRows = useMemo(() => {
    const term = [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase();
    if (!term) {
      return accountRows;
    }
    return accountRows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [accountRows, query, globalQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const openModal = (row: AccountRecord) => {
    setModal({ open: true, row, status: row.status ?? "active" });
  };

  const closeModal = () => {
    setModal({ open: false, row: null, status: "active" });
  };

  const saveStatus = async () => {
    if (!modal.row) {
      return;
    }
    const accountId = getAccountId(modal.row);
    if (!accountId) {
      return;
    }
    await clientApi.patch(`/api/admin/accounts/${accountId}/status`, { status: modal.status });
    closeModal();
    loadAccounts();
  };

  const banAccount = async () => {
    if (!modal.row) {
      return;
    }
    const accountId = getAccountId(modal.row);
    if (!accountId) {
      return;
    }
    await clientApi.patch(`/api/admin/accounts/${accountId}/ban`);
    closeModal();
    loadAccounts();
  };

  const unbanAccount = async () => {
    if (!modal.row) {
      return;
    }
    const accountId = getAccountId(modal.row);
    if (!accountId) {
      return;
    }
    await clientApi.patch(`/api/admin/accounts/${accountId}/unban`);
    closeModal();
    loadAccounts();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Users Management</h2>
          <p className="mt-1 text-sm text-zinc-400">Manage roles, status, and account access.</p>
        </div>

        <div className="mb-6 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
          <label className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search username, email, name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
            />
          </label>
          <select className="h-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm text-zinc-300">
            <option>All Roles</option>
            <option>Customer</option>
            <option>Staff</option>
          </select>
          <select className="h-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm text-zinc-300">
            <option>All Status</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Banned</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <th className="pb-3">Account</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((user, index) => {
                const email = user.email ?? "-";
                const username = user.username ?? (email.includes("@") ? email.split("@")[0] : "user");
                const name = user.name ?? user.fullName ?? username;
                const role = user.role ?? roleMap[(user as { plan?: string }).plan ?? ""] ?? "Customer";
                const status = user.status ?? "active";
                const rowId = getAccountId(user) || String(index);
                return (
                  <tr key={rowId} className="border-b border-zinc-800/60 text-zinc-200">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800/70 text-zinc-300">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{name}</p>
                          <p className="text-xs text-zinc-500">@{username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-zinc-500" />
                          {email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <RolePill role={role} />
                    </td>
                    <td className="py-4">
                      <StatusBadge label={status} tone={status === "active" ? "success" : "warning"} />
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(user)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-emerald-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      </div>

      {modal.open && modal.row ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold">Update Account</h4>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Account</p>
                <p className="mt-2 font-semibold text-white">{modal.row.name ?? modal.row.fullName ?? "User"}</p>
                <p className="text-xs text-zinc-500">{modal.row.email ?? "-"}</p>
              </div>
              <label className="grid gap-2 text-xs text-zinc-400">
                Status
                <select
                  value={modal.status}
                  onChange={(event) => setModal((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="banned">banned</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={unbanAccount}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400 px-4 py-1.5 text-xs font-semibold text-emerald-200"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Unban
              </button>
              <button
                type="button"
                onClick={banAccount}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-200"
              >
                <Ban className="h-3.5 w-3.5" />
                Ban
              </button>
              <button
                type="button"
                onClick={saveStatus}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400 px-4 py-1.5 text-xs font-semibold text-emerald-200"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

