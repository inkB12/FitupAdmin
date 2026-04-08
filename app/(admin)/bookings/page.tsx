"use client";

import { Ban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import {
  buildFilterOptions,
  findDynamicFilterKey,
  formatFieldLabel,
  getDisplayText,
  matchesFilter,
  matchesSearch,
} from "@/lib/admin-ui";
import { clientApi } from "@/lib/client-api";

type BookingRow = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: BookingRow[];
};

const PAGE_SIZE = 6;

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

  return { columns, rows };
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
  const [filterValue, setFilterValue] = useState("all");
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
  const filterKey = useMemo(() => findDynamicFilterKey(table?.columns ?? []), [table]);
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
    const rows = table?.rows ?? [];
    return rows.filter(
      (row) => matchesSearch(row, combinedQuery) && matchesFilter(row, filterKey, filterValue)
    );
  }, [combinedQuery, filterKey, filterValue, table]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const forceCancel = async (id: string) => {
    if (!id) {
      return;
    }

    await clientApi.patch(`/api/Booking/${id}/force-cancel`);
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Booking Oversight"
        title="PT Bookings"
        description="Make booking rows easier to scan, then filter live records by the most relevant column returned from the API."
        stats={[
          { label: "Bookings", value: String(table?.rows.length ?? 0), tone: "info" },
          { label: "Visible rows", value: String(filteredRows.length), tone: "accent" },
          { label: "Columns", value: String(table?.columns.length ?? 0), tone: "success" },
        ]}
      />

      {!table ? (
        <section className="admin-surface rounded-3xl p-6">
          <p className="text-sm font-semibold text-white">Booking data is unavailable.</p>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Once the booking API responds, records will appear here.
          </p>
        </section>
      ) : (
        <section className="admin-surface rounded-3xl p-6 md:p-7">
          <PageToolbar
            className="mb-5"
            searchValue={query}
            onSearchChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            searchPlaceholder="Search bookings, trainers, members, or dates"
            resultLabel={`Showing ${pageRows.length} of ${filteredRows.length} bookings`}
            filters={
              filterKey
                ? [
                    {
                      label: formatFieldLabel(filterKey),
                      value: filterValue,
                      onChange: (value) => {
                        setFilterValue(value);
                        setPage(1);
                      },
                      options: filterOptions,
                    },
                  ]
                : []
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                  {table.columns.map((column) => (
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
                      {table.columns.map((column) => (
                        <td key={column} className="py-3 pr-4 text-xs leading-5">
                          {getDisplayText(row[column]) || "-"}
                        </td>
                      ))}
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void forceCancel(getRowId(row))}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-semibold text-amber-100 transition-colors hover:border-amber-400/60"
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Page ${currentPage} of ${totalPages}`}
          />
        </section>
      )}
    </div>
  );
}
