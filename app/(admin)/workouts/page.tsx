"use client";

import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { clientApi } from "@/lib/client-api";

type WorkoutRow = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: WorkoutRow[];
};

type InlineTableProps = {
  title: string;
  table: TableSpec | null;
  globalQuery: string;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type ModalState = {
  mode: "create" | "edit" | null;
  rowId: string | null;
  values: Record<string, string>;
};

const PAGE_SIZE = 6;

function shouldHideColumn(column: string) {
  return column.toLowerCase().includes("id");
}

function findArray(value: unknown, depth = 0): WorkoutRow[] | null {
  if (Array.isArray(value)) {
    return value as WorkoutRow[];
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
  return { columns, rows: rows as WorkoutRow[] };
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

function getRowId(row: WorkoutRow) {
  if (typeof row.id === "string") {
    return row.id;
  }
  if (typeof row._id === "string") {
    return row._id;
  }
  return "";
}

function InlineEditableTable({ title, table, onCreate, onUpdate, onDelete, globalQuery }: InlineTableProps) {
  const [modal, setModal] = useState<ModalState>({ mode: null, rowId: null, values: {} });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const columns = table?.columns ?? [];
  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim(),
    [query, globalQuery],
  );

  const filteredRows = useMemo(() => {
    const source = table?.rows ?? [];
    const term = combinedQuery.toLowerCase();
    if (!term) {
      return source;
    }
    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [table, combinedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column] = "";
    });
    setModal({ mode: "create", rowId: null, values });
  };

  const openEdit = (row: WorkoutRow) => {
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

  if (!table) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search records"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        </div>
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
            {pageRows.map((row, index) => {
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
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 disabled:opacity-50"
          >
            Prev
          </button>
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

      {modal.mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold">
                {modal.mode === "create" ? `Create ${title}` : `Update ${title}`}
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

export default function WorkoutsPage() {
  const [rawTypes, setRawTypes] = useState<unknown>(null);
  const [rawWorkouts, setRawWorkouts] = useState<unknown>(null);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  useEffect(() => {
    let active = true;
    clientApi.get("/api/workout-types").then((result) => {
      if (active) {
        setRawTypes(result.data ?? null);
      }
    });
    clientApi.get("/api/workouts").then((result) => {
      if (active) {
        setRawWorkouts(result.data ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const typeTable = useMemo(() => buildTable(rawTypes), [rawTypes]);
  const workoutTable = useMemo(() => buildTable(rawWorkouts), [rawWorkouts]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Workouts</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage workout types and workout libraries.</p>
      </section>

      <InlineEditableTable
        title="Workout Types"
        table={typeTable}
        globalQuery={globalQuery}
        onCreate={(payload) => clientApi.post("/api/workout-types", payload)}
        onUpdate={(id, payload) => clientApi.put(`/api/workout-types/${id}`, payload)}
        onDelete={(id) => clientApi.delete(`/api/workout-types/${id}`)}
      />

      <InlineEditableTable
        title="Workouts"
        table={workoutTable}
        globalQuery={globalQuery}
        onCreate={(payload) => clientApi.post("/api/workouts", payload)}
        onUpdate={(id, payload) => clientApi.put(`/api/workouts/${id}`, payload)}
        onDelete={(id) => clientApi.delete(`/api/workouts/${id}`)}
      />
    </div>
  );
}



