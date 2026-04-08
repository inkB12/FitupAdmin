"use client";

import { ArrowDownLeft, ArrowUpRight, Pencil, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PageHero from "@/components/admin/PageHero";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi } from "@/lib/client-api";

type ConversionRateApiRow = {
  id?: string;
  type?: number | string | null;
  rate?: number | string | null;
  status?: number | string | null;
};

type ConversionRateRow = {
  id: string;
  type: number;
  rate: number;
  status: number;
};

type EditState = {
  open: boolean;
  row: ConversionRateRow | null;
  ratePercent: string;
  status: string;
  error: string | null;
  saving: boolean;
};

function findArray(value: unknown, depth = 0): ConversionRateApiRow[] | null {
  if (Array.isArray(value)) {
    return value as ConversionRateApiRow[];
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

function normalizeRows(payload: unknown): ConversionRateRow[] {
  const rows = findArray(payload) ?? [];

  return rows
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      type: toNumber(row.type),
      rate: toNumber(row.rate),
      status: toNumber(row.status),
    }))
    .filter((row) => row.id);
}

function formatPercent(rate: number) {
  const percent = rate * 100;
  const value = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, "");
  return `${value}%`;
}

function formatPercentInput(rate: number) {
  const percent = rate * 100;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, "");
}

function parsePercentInput(value: string) {
  const parsed = Number.parseFloat(value.replace("%", "").trim());
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return parsed / 100;
}

function getTypeLabel(type: number) {
  if (type === 1) {
    return "Topup";
  }

  if (type === 2) {
    return "Withdraw";
  }

  return `Type ${type}`;
}

function getTypeDescription(type: number) {
  if (type === 1) {
    return "Conversion rate for money topup flow.";
  }

  if (type === 2) {
    return "Conversion rate for money withdraw flow.";
  }

  return "Conversion rate configuration.";
}

function getStatusLabel(status: number) {
  return status === 0 ? "On" : "Off";
}

function getStatusTone(status: number) {
  return status === 0 ? "success" : "warning";
}

function getRowByType(rows: ConversionRateRow[], type: number) {
  return rows.find((row) => row.type === type) ?? null;
}

export default function ConversionRatesPage() {
  const [rows, setRows] = useState<ConversionRateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({
    open: false,
    row: null,
    ratePercent: "",
    status: "0",
    error: null,
    saving: false,
  });

  const loadRates = useCallback(() => {
    clientApi.get("/api/conversion-rates").then((result) => {
      setError(result.error);
      setRows(normalizeRows(result.data));
    });
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const topupRow = useMemo(() => getRowByType(rows, 1), [rows]);
  const withdrawRow = useMemo(() => getRowByType(rows, 2), [rows]);
  const onCount = useMemo(() => rows.filter((row) => row.status === 0).length, [rows]);

  const openEdit = (row: ConversionRateRow) => {
    setEdit({
      open: true,
      row,
      ratePercent: formatPercentInput(row.rate),
      status: String(row.status),
      error: null,
      saving: false,
    });
  };

  const closeEdit = () => {
    setEdit({
      open: false,
      row: null,
      ratePercent: "",
      status: "0",
      error: null,
      saving: false,
    });
  };

  const saveEdit = async () => {
    if (!edit.row) {
      return;
    }

    const rate = parsePercentInput(edit.ratePercent);
    const status = Number.parseInt(edit.status, 10);

    if (rate === null) {
      setEdit((prev) => ({
        ...prev,
        error: "Rate must be between 0 and 100. Example: 90 means 90%.",
      }));
      return;
    }

    if (![0, 1].includes(status)) {
      setEdit((prev) => ({
        ...prev,
        error: "Status only accepts 0 (On) or 1 (Off).",
      }));
      return;
    }

    setEdit((prev) => ({ ...prev, saving: true, error: null }));

    const result = await clientApi.put(`/api/conversion-rates/${edit.row.id}`, {
      type: edit.row.type,
      rate,
      status,
    });

    if (result.error) {
      setEdit((prev) => ({ ...prev, saving: false, error: result.error }));
      return;
    }

    closeEdit();
    loadRates();
  };

  const cards = [
    {
      row: topupRow,
      title: "Topup",
      icon: ArrowUpRight,
      iconTone: "text-emerald-200 bg-emerald-400/12 border-emerald-400/20",
      accent: "from-emerald-400/14 to-sky-400/8",
    },
    {
      row: withdrawRow,
      title: "Withdraw",
      icon: ArrowDownLeft,
      iconTone: "text-amber-100 bg-amber-400/12 border-amber-400/20",
      accent: "from-amber-400/14 to-rose-400/8",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Payment Rules"
        title="Conversion Rate Controls"
        description="This page now focuses on the only two conversion rules in the system: Topup and Withdraw. Each card shows its live rate and switch state clearly."
        stats={[
          { label: "Configs", value: "2", tone: "info" },
          { label: "Currently on", value: String(onCount), tone: "success" },
          { label: "Currently off", value: String(rows.filter((row) => row.status === 1).length), tone: "warning" },
        ]}
      />

      {error ? (
        <section className="admin-surface rounded-3xl p-6">
          <p className="text-sm font-semibold text-white">Unable to load conversion rates.</p>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          const row = card.row;

          return (
            <article
              key={card.title}
              className={`admin-surface relative overflow-hidden rounded-3xl p-6`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl border p-3 ${card.iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="admin-kicker">{card.title}</p>
                      <h3 className="mt-1 text-2xl font-black text-white">{card.title}</h3>
                      <p className="mt-2 text-sm text-[var(--admin-muted)]">
                        {row ? getTypeDescription(row.type) : "Configuration has not been returned by the API yet."}
                      </p>
                    </div>
                  </div>

                  {row ? <StatusBadge label={getStatusLabel(row.status)} tone={getStatusTone(row.status)} /> : null}
                </div>

                {row ? (
                  <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="admin-panel rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Rate</p>
                        <p className="mt-2 text-3xl font-black text-white">{formatPercent(row.rate)}</p>
                      </div>

                      <div className="admin-panel rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Status</p>
                        <p className="mt-2 text-3xl font-black text-white">{getStatusLabel(row.status)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] transition-colors hover:border-[#f0b35b]/70"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit {getTypeLabel(row.type)}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 admin-panel rounded-2xl p-5">
                    <p className="text-sm font-semibold text-white">{card.title} config is missing.</p>
                    <p className="mt-2 text-sm text-[var(--admin-muted)]">
                      Expected API row with type {card.title === "Topup" ? "1" : "2"}.
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {edit.open && edit.row ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface w-full max-w-xl rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold text-white">
                Update {getTypeLabel(edit.row.type)} Conversion Rate
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
                <span className="uppercase tracking-[0.12em]">Type</span>
                <input
                  value={`${getTypeLabel(edit.row.type)} (${edit.row.type})`}
                  disabled
                  className="h-11 rounded-2xl border border-white/12 bg-[#09111c] px-4 text-sm text-[var(--admin-muted)] outline-none"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="uppercase tracking-[0.12em]">Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={edit.ratePercent}
                  onChange={(event) =>
                    setEdit((prev) => ({ ...prev, ratePercent: event.target.value }))
                  }
                  className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="uppercase tracking-[0.12em]">Status</span>
                <select
                  value={edit.status}
                  onChange={(event) => setEdit((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                >
                  <option value="0">On</option>
                  <option value="1">Off</option>
                </select>
              </label>
            </div>

            {edit.error ? <p className="mt-3 text-sm text-rose-300">{edit.error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
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
                className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {edit.saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
