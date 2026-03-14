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

export default function WorkoutsPage() {
  const [types, setTypes] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [workouts, setWorkouts] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [actionResult, setActionResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [typeId, setTypeId] = useState("");
  const [workoutId, setWorkoutId] = useState("");
  const [typePayload, setTypePayload] = useState("{}");
  const [workoutPayload, setWorkoutPayload] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/workout-types").then((result) => {
      if (active) {
        setTypes(result);
      }
    });
    clientApi.get<unknown>("/api/workouts").then((result) => {
      if (active) {
        setWorkouts(result);
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

  const handleTypeCreate = async () => {
    const parsed = parseJson(typePayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.post("/api/workout-types", parsed.data));
  };

  const handleTypeUpdate = async () => {
    const parsed = parseJson(typePayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.put(`/api/workout-types/${typeId}`, parsed.data));
  };

  const handleWorkoutCreate = async () => {
    const parsed = parseJson(workoutPayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.post("/api/workouts", parsed.data));
  };

  const handleWorkoutUpdate = async () => {
    const parsed = parseJson(workoutPayload);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    await runAction(() => clientApi.put(`/api/workouts/${workoutId}`, parsed.data));
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Workouts</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage workout types and workout libraries.</p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Workout Types</h3>
        <input
          type="text"
          value={typeId}
          onChange={(event) => setTypeId(event.target.value)}
          placeholder="Workout Type ID"
          className="mt-3 h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45] md:w-72"
        />
        <textarea
          value={typePayload}
          onChange={(event) => setTypePayload(event.target.value)}
          className="mt-3 h-32 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-100"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={handleTypeCreate}
          >
            Create Type
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={handleTypeUpdate}
            disabled={!typeId}
          >
            Update Type
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-rose-400 hover:text-rose-300"
            onClick={() => runAction(() => clientApi.delete(`/api/workout-types/${typeId}`))}
            disabled={!typeId}
          >
            Delete Type
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Workouts</h3>
        <input
          type="text"
          value={workoutId}
          onChange={(event) => setWorkoutId(event.target.value)}
          placeholder="Workout ID"
          className="mt-3 h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45] md:w-72"
        />
        <textarea
          value={workoutPayload}
          onChange={(event) => setWorkoutPayload(event.target.value)}
          className="mt-3 h-32 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-100"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={handleWorkoutCreate}
          >
            Create Workout
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={handleWorkoutUpdate}
            disabled={!workoutId}
          >
            Update Workout
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-rose-400 hover:text-rose-300"
            onClick={() => runAction(() => clientApi.delete(`/api/workouts/${workoutId}`))}
            disabled={!workoutId}
          >
            Delete Workout
          </button>
        </div>
      </section>

      {jsonError ? <p className="text-sm text-amber-300">{jsonError}</p> : null}

      <ApiPanel title="Workout Types API" data={types.data} error={types.error} />
      <ApiPanel title="Workouts API" data={workouts.data} error={workouts.error} />
      <ApiPanel title="Workout Action Result" data={actionResult.data} error={actionResult.error} />
    </div>
  );
}
