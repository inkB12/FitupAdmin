"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageToolbar from "@/components/admin/PageToolbar";
import {
  buildFilterOptions,
  findDynamicFilterKey,
  formatFieldLabel,
  getDisplayText,
  matchesFilter,
  matchesSearch,
  type DynamicRow,
} from "@/lib/admin-ui";

type TableSpec = {
  columns: string[];
  rows: DynamicRow[];
};

type ModalState = {
  mode: "create" | "edit" | null;
  rowId: string | null;
  values: Record<string, string>;
};

type EditableDataTableProps = {
  title: string;
  table: TableSpec | null;
  globalQuery: string;
  onCreate: (payload: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  emptyTitle?: string;
  emptyDescription?: string;
  createLabel?: string;
};

const PAGE_SIZE = 6;

function getRowId(row: DynamicRow) {
  if (typeof row.id === "string") {
    return row.id;
  }
  if (typeof row._id === "string") {
    return row._id;
  }
  return "";
}

export default function EditableDataTable({
  title,
  table,
  globalQuery,
  onCreate,
  onUpdate,
  onDelete,
  emptyTitle = "No data available",
  emptyDescription = "Once the API returns data, records will show up here.",
  createLabel = "Create",
}: EditableDataTableProps) {
  const [modal, setModal] = useState<ModalState>({ mode: null, rowId: null, values: {} });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterValue, setFilterValue] = useState("all");

  const columns = useMemo(() => table?.columns ?? [], [table]);
  const filterKey = useMemo(() => findDynamicFilterKey(columns), [columns]);
  const filterOptions = useMemo(
    () =>
      buildFilterOptions(
        table?.rows ?? [],
        filterKey,
        filterKey ? `All ${formatFieldLabel(filterKey)}` : "All records"
      ),
    [filterKey, table]
  );

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const filteredRows = useMemo(() => {
    const source = table?.rows ?? [];
    return source.filter(
      (row) => matchesSearch(row, combinedQuery) && matchesFilter(row, filterKey, filterValue)
    );
  }, [combinedQuery, filterKey, filterValue, table]);

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

  const openEdit = (row: DynamicRow) => {
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column] = getDisplayText(row[column]);
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
    return (
      <section className="admin-surface rounded-3xl p-6 md:p-7">
        <p className="text-sm font-semibold text-white">{emptyTitle}</p>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <section className="admin-surface rounded-3xl p-6 md:p-7">
      <div className="mb-5">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Search across records and focus the table with quick filters.
        </p>
      </div>

      <PageToolbar
        className="mb-5"
        searchValue={query}
        onSearchChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchPlaceholder={`Search ${title.toLowerCase()}`}
        resultLabel={`Showing ${pageRows.length} of ${filteredRows.length} records`}
        filters={
          filterKey
            ? [
                {
                  label: formatFieldLabel(filterKey),
                  value: filterValue,
                  options: filterOptions,
                  onChange: (value) => {
                    setFilterValue(value);
                    setPage(1);
                  },
                },
              ]
            : []
        }
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] transition-colors hover:border-[#f0b35b]/70 hover:bg-[#f0b35b]/16"
          >
            <Plus className="h-3.5 w-3.5" />
            {createLabel}
          </button>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              {columns.map((column) => (
                <th key={column} className="pb-3 pr-4 font-semibold">
                  {formatFieldLabel(column)}
                </th>
              ))}
              <th className="pb-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => {
              const rowId = getRowId(row) || String(index);

              return (
                <tr key={rowId} className="border-b border-white/8 text-[var(--admin-soft)]">
                  {columns.map((column) => (
                    <td key={column} className="py-3 pr-4 text-xs leading-5">
                      {getDisplayText(row[column]) || "-"}
                    </td>
                  ))}
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:border-emerald-400/50 hover:text-emerald-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const id = getRowId(row);
                          if (id && window.confirm(`Are you sure you want to delete this ${title.toLowerCase()} record?`)) {
                            void onDelete(id);
                          }
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:border-rose-400/50 hover:text-rose-200"
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        summary={`Page ${currentPage} of ${totalPages}`}
      />

      {modal.mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface w-full max-w-xl rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold text-white">
                {modal.mode === "create" ? `Create ${title}` : `Update ${title}`}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              {columns.map((column) => (
                <label key={column} className="grid gap-2 text-xs font-semibold text-[var(--admin-muted)]">
                  <span className="uppercase tracking-[0.12em]">{formatFieldLabel(column)}</span>
                  <input
                    value={modal.values[column] ?? ""}
                    onChange={(event) =>
                      setModal((prev) => ({
                        ...prev,
                        values: { ...prev.values, [column]: event.target.value },
                      }))
                    }
                    className="h-11 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-white outline-none transition-colors focus:border-[#f0b35b]/80"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveModal()}
                className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/35 bg-[#f0b35b]/10 px-4 py-2 text-xs font-semibold text-[#ffe2a3] transition-colors hover:border-[#f0b35b]/70"
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
