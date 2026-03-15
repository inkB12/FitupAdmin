"use client";

import { Ban, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { clientApi } from "@/lib/client-api";

type BookingRow = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: BookingRow[];
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

function shouldHideColumn(column: string) {
  return column.toLowerCase().includes("id");
}

function findArray(value: unknown, depth = 0): BookingRow[] | null {
  if (Array.isArray(value)) {
    return value as BookingRow[];
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
  return { columns, rows: rows as BookingRow[] };
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

function getRowId(row: BookingRow) {
  if (typeof row.id === "string") {
    return row.id;
  }
  if (typeof row._id === "string") {
    return row._id;
  }
  return "";
}

export default function BookingsPage() {
  const [rawBookings, setRawBookings] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  useEffect(() => {
    let active = true;
    clientApi.get("/api/Booking/admin/bookings").then((result) => {
      if (active) {
        setRawBookings(result.data ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const table = useMemo(() => buildTable(rawBookings), [rawBookings]);
  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim(),
    [query, globalQuery],
  );

  const filteredRows = useMemo(() => {
    if (!table) {
      return [] as BookingRow[];
    }
    const term = combinedQuery.toLowerCase();
    if (!term) {
      return table.rows;
    }
    return table.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [table, combinedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const forceCancel = async (id: string) => {
    if (!id) {
      return;
    }
    await clientApi.patch(`/api/Booking/${id}/force-cancel`);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">PT Bookings</h2>
        <p className="mt-1 text-sm text-zinc-400">Review trainer bookings and manage force-cancel actions.</p>
      </section>

      {table ? (
        <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search bookings"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="text-xs text-zinc-500">Showing {pageRows.length} of {filteredRows.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  {table.columns.map((column) => (
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
                      {table.columns.map((column) => (
                        <td key={column} className="py-3 text-xs">
                          {renderCell(row[column])}
                        </td>
                      ))}
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => forceCancel(getRowId(row))}
                          className="inline-flex h-8 items-center gap-2 rounded-full border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
                          disabled={!getRowId(row)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel
                        </button>
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
        </section>
      ) : null}
    </div>
  );
}


