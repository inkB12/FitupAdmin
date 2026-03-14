"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ApiStatus from "@/components/admin/ApiStatus";
import { clientApi } from "@/lib/client-api";

type ConversionRow = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: ConversionRow[];
};

type InlineTableProps = {
  title: string;
  table: TableSpec | null;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type ModalState = {
  mode: "create" | "edit" | null;
  rowId: string | null;
  values: Record<string, string>;
};

function shouldHideColumn(column: string) {
  return column.toLowerCase().includes("id");
}

function findArray(value: unknown, depth = 0): ConversionRow[] | null {
  if (Array.isArray(value)) {
    return value as ConversionRow[];
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
    .filter((column) => !shouldHideColumn(column))
    .slice(0, 6);
  return { columns, rows: rows as ConversionRow[] };
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

function getRowId(row: ConversionRow) {
  if (typeof row.id === "string") {
    return row.id;
  }
  if (typeof row._id === "string") {
    return row._id;
  }
  return "";
}

function InlineEditableTable({ title, table, onCreate, onUpdate, onDelete }: InlineTableProps) {
  const [modal, setModal] = useState<ModalState>({ mode: null, rowId: null, values: {} });

  if (!table) {
    return null;
  }

  const { columns, rows } = table;

  const openCreate = () => {
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column] = "";
    });
    setModal({ mode: "create", rowId: null, values });
  };

  const openEdit = (row: ConversionRow) => {
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column] = row[column] !== undefined && row[column] !== null ? String(row[column]) : "";
    });
    setModal({ mode: "edit", rowId: getRowId(row) || null, values });
  };

  const closeModal = () => {
    setModal({ mode: null, rowId: null, values: {} });
  };

  const saveModal = async () => {
    const payload: Record<string, unknown> = {};
    columns.forEach((column) => {
      payload[column] = modal.values[column] ?? "";
    });
    if (modal.mode === "create") {
      await onCreate(payload);
    }
    if (modal.mode === "edit" && modal.rowId) {
      await onUpdate(modal.rowId, payload);
    }
    closeModal();
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
              {columns.map((column) => (
                <th key={column} className="pb-3">
                  {column}
                </th>
              ))}
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, index) => {
              const rowId = getRowId(row) || String(index);
              return (
                <tr key={rowId} className="border-b border-zinc-800/60 text-zinc-200">
                  {columns.map((column) => (
                    <td key={column} className="py-3 text-xs">
                      {renderCell(row[column])}
                    </td>
                  ))}
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-emerald-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const id = getRowId(row);
                          if (id) {
                            onDelete(id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-rose-300"
                        disabled={!getRowId(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold">
                {modal.mode === "create" ? "Create Conversion Rate" : "Update Conversion Rate"}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3">
              {columns.map((column) => (
                <label key={column} className="grid gap-2 text-xs text-zinc-400">
                  {column}
                  <input
                    value={modal.values[column] ?? ""}
                    onChange={(event) =>
                      setModal((prev) => ({
                        ...prev,
                        values: { ...prev.values, [column]: event.target.value },
                      }))
                    }
                    className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModal}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400 px-4 py-1.5 text-xs font-semibold text-emerald-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function ConversionRatesPage() {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawRates, setRawRates] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    clientApi.get("/api/conversion-rates").then((result) => {
      if (active) {
        setError(result.error ?? null);
        setChecked(true);
        setRawRates(result.data ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const table = useMemo(() => buildTable(rawRates), [rawRates]);

  return (
    <div className="space-y-6">
      <ApiStatus label="Conversion Rates API" checked={checked} error={error} />
      <section>
        <h2 className="text-2xl font-black">Conversion Rates</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage conversion rate records for reporting.</p>
      </section>

      <InlineEditableTable
        title="Conversion Rates"
        table={table}
        onCreate={(payload) => clientApi.post("/api/conversion-rates", payload)}
        onUpdate={(id, payload) => clientApi.put(`/api/conversion-rates/${id}`, payload)}
        onDelete={(id) => clientApi.delete(`/api/conversion-rates/${id}`)}
      />
    </div>
  );
}
