"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { matchesSearch } from "@/lib/admin-ui";
import { clientApi, type ApiResult } from "@/lib/client-api";

type PremiumType = {
  id?: string;
  describe?: string | null;
  duration?: number | string | null;
  price?: number | string | null;
  status?: number | string | null;
};

type PremiumCard = {
  id: string;
  describe: string;
  duration: number;
  price: number;
  status: number;
};

type EditState = {
  open: boolean;
  mode: "create" | "edit";
  id: string | null;
  describe: string;
  duration: string;
  price: string;
  status: string;
  error: string | null;
  saving: boolean;
};

const PAGE_SIZE = 6;

function findArray(value: unknown, depth = 0): PremiumType[] | null {
  if (Array.isArray(value)) {
    return value as PremiumType[];
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

function normalizeStatus(value: PremiumType["status"]) {
  if (typeof value === "number") {
    return value === 0 ? 0 : 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "0" || normalized === "active" || normalized === "on") {
      return 0;
    }
    return 1;
  }

  return 0;
}

function extractPremiumTypes(payload: unknown): PremiumCard[] {
  const rows = findArray(payload) ?? [];

  return rows
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      describe: row.describe?.trim() || "Premium package",
      duration: toNumber(row.duration),
      price: toNumber(row.price),
      status: normalizeStatus(row.status),
    }))
    .filter((row) => row.id);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusTone(status: number) {
  return status === 0 ? "success" : "warning";
}

function getStatusLabel(status: number) {
  return status === 0 ? "Active" : "Inactive";
}

function getDurationLabel(days: number) {
  if (days === 30) {
    return "1 month";
  }
  if (days === 7) {
    return "1 week";
  }
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

const emptyEditState: EditState = {
  open: false,
  mode: "create",
  id: null,
  describe: "",
  duration: "",
  price: "",
  status: "0",
  error: null,
  saving: false,
};

export default function PackagesPage() {
  const [premiumTypes, setPremiumTypes] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { debouncedQuery: globalQuery } = useAdminSearch();
  const [edit, setEdit] = useState<EditState>(emptyEditState);

  const loadPremiumTypes = useCallback(() => {
    clientApi.get<unknown>("/api/premium/admin/types").then((result) => {
      setPremiumTypes(result);
    });
  }, []);

  useEffect(() => {
    loadPremiumTypes();
  }, [loadPremiumTypes]);

  const premiumRows = useMemo(
    () => extractPremiumTypes(premiumTypes.data),
    [premiumTypes.data]
  );

  const durationOptions = useMemo(
    () => [
      { label: "All durations", value: "all" },
      ...Array.from(new Set(premiumRows.map((item) => String(item.duration)))).map((duration) => ({
        label: getDurationLabel(Number.parseInt(duration, 10)),
        value: duration,
      })),
    ],
    [premiumRows]
  );

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const filteredRows = useMemo(() => {
    return premiumRows.filter((item) => {
      const matchesStatus = statusFilter === "all" || String(item.status) === statusFilter;
      const matchesDuration = durationFilter === "all" || String(item.duration) === durationFilter;
      return matchesStatus && matchesDuration && matchesSearch(item, combinedQuery);
    });
  }, [combinedQuery, durationFilter, premiumRows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEdit({
      ...emptyEditState,
      open: true,
      mode: "create",
      status: "0",
    });
  };

  const openEdit = (item: PremiumCard) => {
    setEdit({
      open: true,
      mode: "edit",
      id: item.id,
      describe: item.describe,
      duration: String(item.duration),
      price: String(item.price),
      status: String(item.status),
      error: null,
      saving: false,
    });
  };

  const closeEdit = () => {
    setEdit(emptyEditState);
  };

  const saveEdit = async () => {
    const duration = Number.parseInt(edit.duration, 10);
    const price = Number.parseInt(edit.price, 10);
    const status = Number.parseInt(edit.status, 10);

    if (!edit.describe.trim()) {
      setEdit((prev) => ({ ...prev, error: "Description is required." }));
      return;
    }

    if (Number.isNaN(duration) || duration <= 0) {
      setEdit((prev) => ({ ...prev, error: "Duration must be a positive number." }));
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      setEdit((prev) => ({ ...prev, error: "Price must be 0 or greater." }));
      return;
    }

    if (![0, 1].includes(status)) {
      setEdit((prev) => ({ ...prev, error: "Status only accepts 0 or 1." }));
      return;
    }

    setEdit((prev) => ({ ...prev, saving: true, error: null }));

    const payload =
      edit.mode === "create"
        ? {
            describe: edit.describe.trim(),
            duration,
            price,
          }
        : {
            describe: edit.describe.trim(),
            duration,
            price,
            status,
          };

    const result =
      edit.mode === "create"
        ? await clientApi.post("/api/premium/admin/types", payload)
        : await clientApi.put(`/api/premium/admin/types/${edit.id}`, payload);

    if (result.error) {
      setEdit((prev) => ({ ...prev, saving: false, error: result.error }));
      return;
    }

    closeEdit();
    loadPremiumTypes();
  };

  const deletePremiumType = async (id: string) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this premium type?");
    if (!confirmed) {
      return;
    }

    await clientApi.delete(`/api/premium/admin/types/${id}`);
    loadPremiumTypes();
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Revenue Structure"
        title="Premium Management"
        description="Manage premium packages with the current admin API while keeping the existing card-based workflow."
        stats={[
          { label: "Premium types", value: String(premiumRows.length), tone: "info" },
          {
            label: "Active",
            value: String(premiumRows.filter((item) => item.status === 0).length),
            tone: "success",
          },
          {
            label: "Inactive",
            value: String(premiumRows.filter((item) => item.status === 1).length),
            tone: "warning",
          },
        ]}
      />

      <section className="admin-surface rounded-3xl p-6">
        <PageToolbar
          className="mb-5"
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search premium description, duration, or ID"
          resultLabel={`Showing ${pageRows.length} of ${filteredRows.length} premium types`}
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
                { label: "Active", value: "0" },
                { label: "Inactive", value: "1" },
              ],
            },
            {
              label: "Duration",
              value: durationFilter,
              onChange: (value) => {
                setDurationFilter(value);
                setPage(1);
              },
              options: durationOptions,
            },
          ]}
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] transition-colors hover:border-[#f0b35b]/70"
            >
              <Plus className="h-3.5 w-3.5" />
              Create premium
            </button>
          }
        />

        {premiumTypes.error ? <p className="mb-4 text-sm text-rose-300">{premiumTypes.error}</p> : null}

        {pageRows.length === 0 ? (
          <div className="admin-panel rounded-3xl p-6">
            <p className="text-sm font-semibold text-white">No premium types match the current filters.</p>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              Clear the search or change the status and duration filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((item) => (
              <article key={item.id} className="admin-panel rounded-3xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Premium</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{item.describe}</h3>
                  </div>
                  <StatusBadge label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />
                </div>

                <p className="mt-4 text-lg font-semibold text-[#ffe2a3]">{formatCurrency(item.price)}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--admin-muted)]">
                  Duration: {getDurationLabel(item.duration)}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Duration</p>
                  <p className="mt-2 text-2xl font-black text-white">{item.duration}</p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">days</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 font-semibold text-[#ffe2a3] transition-colors hover:border-[#f0b35b]/70"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePremiumType(item.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 font-semibold text-rose-200 transition-colors hover:border-rose-400/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                  <span className="text-[var(--admin-muted)]">ID: {item.id}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Page ${currentPage} of ${totalPages}`}
        />
      </section>

      {edit.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface w-full max-w-xl rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold text-white">
                {edit.mode === "create" ? "Create Premium Type" : "Edit Premium Type"}
              </h4>
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="uppercase tracking-[0.12em]">Description</span>
                <input
                  value={edit.describe}
                  onChange={(event) => setEdit((prev) => ({ ...prev, describe: event.target.value }))}
                  className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="uppercase tracking-[0.12em]">Duration</span>
                <input
                  type="number"
                  min="1"
                  value={edit.duration}
                  onChange={(event) => setEdit((prev) => ({ ...prev, duration: event.target.value }))}
                  className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="uppercase tracking-[0.12em]">Price</span>
                <input
                  type="number"
                  min="0"
                  value={edit.price}
                  onChange={(event) => setEdit((prev) => ({ ...prev, price: event.target.value }))}
                  className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                />
              </label>

              {edit.mode === "edit" ? (
                <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                  <span className="uppercase tracking-[0.12em]">Status</span>
                  <select
                    value={edit.status}
                    onChange={(event) => setEdit((prev) => ({ ...prev, status: event.target.value }))}
                    className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                  >
                    <option value="0">active</option>
                    <option value="1">inactive</option>
                  </select>
                </label>
              ) : null}
            </div>

            {edit.error ? <p className="mt-3 text-sm text-rose-300">{edit.error}</p> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={edit.saving}
                className="rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] disabled:opacity-60"
              >
                {edit.saving ? "Saving..." : edit.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
