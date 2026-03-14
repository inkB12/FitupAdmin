"use client";

import { Ban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ApiStatus from "@/components/admin/ApiStatus";
import { clientApi } from "@/lib/client-api";

type BookingRow = Record<string, unknown>;

type TableSpec = {
  columns: string[];
  rows: BookingRow[];
};

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
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawBookings, setRawBookings] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    clientApi.get("/api/Booking/admin/bookings").then((result) => {
      if (active) {
        setError(result.error ?? null);
        setChecked(true);
        setRawBookings(result.data ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const table = useMemo(() => buildTable(rawBookings), [rawBookings]);

  const forceCancel = async (id: string) => {
    if (!id) {
      return;
    }
    await clientApi.patch(`/api/Booking/${id}/force-cancel`);
  };

  return (
    <div className="space-y-6">
      <ApiStatus label="Bookings API" checked={checked} error={error} />
      <section>
        <h2 className="text-2xl font-black">PT Bookings</h2>
        <p className="mt-1 text-sm text-zinc-400">Review trainer bookings and manage force-cancel actions.</p>
      </section>

      {table ? (
        <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
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
                {table.rows.slice(0, 10).map((row, index) => {
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
        </section>
      ) : null}
    </div>
  );
}
