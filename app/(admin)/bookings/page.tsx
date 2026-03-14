"use client";

import { useEffect, useState } from "react";

import ApiPanel from "@/components/admin/ApiPanel";
import { clientApi, type ApiResult } from "@/lib/client-api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [actionResult, setActionResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/Booking/admin/bookings").then((result) => {
      if (active) {
        setBookings(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const forceCancel = async () => {
    const result = await clientApi.patch(`/api/Booking/${bookingId}/force-cancel`);
    setActionResult(result);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">PT Bookings</h2>
        <p className="mt-1 text-sm text-zinc-400">Review trainer bookings and manage force-cancel actions.</p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Force Cancel Booking</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="text"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder="Booking ID"
            className="h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45] md:w-72"
          />
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
            onClick={forceCancel}
            disabled={!bookingId}
          >
            Force Cancel
          </button>
        </div>
      </section>

      <ApiPanel title="Bookings API" data={bookings.data} error={bookings.error} />
      <ApiPanel title="Force Cancel Result" data={actionResult.data} error={actionResult.error} />
    </div>
  );
}
