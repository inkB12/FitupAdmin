"use client";

import { useEffect, useMemo, useState } from "react";

import { clientApi, type ApiResult } from "@/lib/client-api";

type PremiumType = {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  description?: string;
  activeUsers?: number;
  activeUserCount?: number;
  price?: number | string;
  monthlyPrice?: number | string;
  monthly?: number | string;
  yearlyPrice?: number | string;
  yearly?: number | string;
  status?: string;
};

type PackageCard = {
  id?: string;
  name: string;
  price: string;
  activeUsers: number;
  description: string;
  rawMonthly?: number | string;
  status?: string;
};

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

function extractPremiumTypes(payload: unknown): PremiumType[] {
  return findArray(payload) ?? [];
}

function formatPrice(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  if (typeof value === "number") {
    return `$${value}`;
  }
  return value;
}

export function createPremiumType(payload: Record<string, unknown>) {
  return clientApi.post<unknown>("/api/premium/admin/types", payload);
}

export function updatePremiumType(premiumTypeId: string, payload: Record<string, unknown>) {
  return clientApi.put<unknown>(`/api/premium/admin/types/${premiumTypeId}`, payload);
}

type EditState = {
  open: boolean;
  id: string | null;
  name: string;
  monthlyPrice: string;
  description: string;
  status: string;
  error: string | null;
  saving: boolean;
};

export default function PackagesPage() {
  const [premiumTypes, setPremiumTypes] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [edit, setEdit] = useState<EditState>({
    open: false,
    id: null,
    name: "",
    monthlyPrice: "",
    description: "",
    status: "active",
    error: null,
    saving: false,
  });

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/premium/admin/types").then((result) => {
      if (active) {
        setPremiumTypes(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const packageRows: PackageCard[] = useMemo(() => {
    const apiRows = extractPremiumTypes(premiumTypes.data);
    return apiRows.map((row) => {
      const name = row.name ?? row.title ?? "Premium";
      const monthly = row.monthlyPrice ?? row.monthly ?? row.price;
      const priceLabel = `${formatPrice(monthly)} / month`;
      const activeUsers =
        typeof row.activeUsers === "number"
          ? row.activeUsers
          : typeof row.activeUserCount === "number"
          ? row.activeUserCount
          : 0;
      return {
        id: typeof row.id === "string" ? row.id : typeof row._id === "string" ? row._id : undefined,
        name,
        price: priceLabel,
        activeUsers,
        description: row.description ?? "Premium plan benefits and coverage.",
        rawMonthly: monthly,
        status: row.status,
      };
    });
  }, [premiumTypes.data]);

  const openEdit = (item: PackageCard) => {
    setEdit({
      open: true,
      id: item.id ?? null,
      name: item.name,
      monthlyPrice: typeof item.rawMonthly === "number" || typeof item.rawMonthly === "string"
        ? String(item.rawMonthly)
        : "",
      description: item.description,
      status: item.status ?? "active",
      error: null,
      saving: false,
    });
  };

  const closeEdit = () => {
    setEdit({
      open: false,
      id: null,
      name: "",
      monthlyPrice: "",
      description: "",
      status: "active",
      error: null,
      saving: false,
    });
  };

  const saveEdit = async () => {
    if (!edit.id) {
      setEdit((prev) => ({ ...prev, error: "Missing premiumTypeId from API response." }));
      return;
    }
    setEdit((prev) => ({ ...prev, saving: true, error: null }));
    const payload = {
      name: edit.name,
      monthlyPrice: edit.monthlyPrice,
      description: edit.description,
      status: edit.status,
    };
    const result = await updatePremiumType(edit.id, payload);
    if (result.error) {
      setEdit((prev) => ({ ...prev, saving: false, error: result.error }));
      return;
    }
    setEdit((prev) => ({ ...prev, saving: false }));
    closeEdit();
    clientApi.get<unknown>("/api/premium/admin/types").then((result) => {
      setPremiumTypes(result);
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Packages</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage plan tiers, pricing, and active subscribers.</p>
      </section>

      {packageRows.length === 0 ? (
        <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
          <p className="text-sm font-semibold text-zinc-200">No packages returned from the API.</p>
          <p className="mt-1 text-xs text-zinc-500">Once data is available, plans will show here.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {packageRows.map((item) => (
            <article key={item.name} className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
              <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Plan</p>
              <h3 className="mt-1 text-2xl font-black text-white">{item.name}</h3>
              <p className="mt-2 text-[#d68c45]">{item.price}</p>
              {item.status ? (
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  Status: {item.status}
                </p>
              ) : null}
              <p className="mt-4 text-sm text-zinc-400">{item.description}</p>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">Active Users</p>
                <p className="mt-1 text-xl font-bold text-white">{item.activeUsers.toLocaleString()}</p>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-full border border-zinc-700 px-4 py-2 font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  Edit package
                </button>
                {item.id ? (
                  <span className="text-[11px] text-zinc-500">ID: {item.id}</span>
                ) : (
                  <span className="text-[11px] text-zinc-500">API ID unavailable</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {edit.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold">Edit Package</h4>
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2 text-xs text-zinc-400">
                Name
                <input
                  value={edit.name}
                  onChange={(event) => setEdit((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Monthly Price
                <input
                  value={edit.monthlyPrice}
                  onChange={(event) => setEdit((prev) => ({ ...prev, monthlyPrice: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Description
                <textarea
                  value={edit.description}
                  onChange={(event) => setEdit((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-[96px] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Status
                <select
                  value={edit.status}
                  onChange={(event) => setEdit((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
            </div>

            {edit.error ? <p className="mt-3 text-xs text-rose-300">{edit.error}</p> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={edit.saving}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400 px-4 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-60"
              >
                {edit.saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
