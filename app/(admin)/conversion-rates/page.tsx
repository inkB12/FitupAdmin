"use client";

import { useEffect, useState } from "react";

import ApiPanel from "@/components/admin/ApiPanel";
import { clientApi, type ApiResult } from "@/lib/client-api";

function parseJson(value: string): { data: unknown | null; error: string | null } {
  if (!value.trim()) {
    return { data: null, error: "JSON payload is empty." };
  }
  try {
    return { data: JSON.parse(value), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { data: null, error: message };
  }
}

export default function ConversionRatesPage() {
  const [rates, setRates] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [actionResult, setActionResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [rateId, setRateId] = useState("");
  const [createPayload, setCreatePayload] = useState("{}");
  const [updatePayload, setUpdatePayload] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/conversion-rates").then((result) => {
      if (active) {
        setRates(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const runAction = async (action: () => Promise<ApiResult<unknown>>) => {
    const result = await action();
    setActionResult(result);
  };

  const handleCreate = async () => {
    const parsed = parseJson(createPayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.post("/api/conversion-rates", parsed.data));
  };

  const handleUpdate = async () => {
    const parsed = parseJson(updatePayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.put(`/api/conversion-rates/${rateId}`, parsed.data));
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Conversion Rates</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage conversion rate records for reporting.</p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Create Conversion Rate</h3>
        <textarea
          value={createPayload}
          onChange={(event) => setCreatePayload(event.target.value)}
          className="mt-3 h-32 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-100"
        />
        <button
          type="button"
          className="mt-3 h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
          onClick={handleCreate}
        >
          Create
        </button>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Update Conversion Rate</h3>
        <input
          type="text"
          value={rateId}
          onChange={(event) => setRateId(event.target.value)}
          placeholder="Conversion Rate ID"
          className="mt-3 h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45] md:w-72"
        />
        <textarea
          value={updatePayload}
          onChange={(event) => setUpdatePayload(event.target.value)}
          className="mt-3 h-32 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-100"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={handleUpdate}
            disabled={!rateId}
          >
            Update
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-rose-400 hover:text-rose-300"
            onClick={() => runAction(() => clientApi.delete(`/api/conversion-rates/${rateId}`))}
            disabled={!rateId}
          >
            Delete
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={() => runAction(() => clientApi.get(`/api/conversion-rates/${rateId}`))}
            disabled={!rateId}
          >
            Get By ID
          </button>
        </div>
        {jsonError ? <p className="mt-3 text-sm text-amber-300">{jsonError}</p> : null}
      </section>

      <ApiPanel title="Conversion Rates API" data={rates.data} error={rates.error} />
      <ApiPanel title="Conversion Rate Action Result" data={actionResult.data} error={actionResult.error} />
    </div>
  );
}
