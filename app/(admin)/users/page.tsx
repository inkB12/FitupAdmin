"use client";

import { useEffect, useState } from "react";

import ApiPanel from "@/components/admin/ApiPanel";
import StatusBadge from "@/components/admin/StatusBadge";
import { clientApi, type ApiResult } from "@/lib/client-api";
import { USERS } from "@/lib/admin-data";

export default function UsersPage() {
  const [accounts, setAccounts] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [actionResult, setActionResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [accountId, setAccountId] = useState("");
  const [statusValue, setStatusValue] = useState("active");

  useEffect(() => {
    let active = true;
    clientApi.get<unknown>("/api/admin/accounts").then((result) => {
      if (active) {
        setAccounts(result);
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

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Users Management</h2>
            <p className="mt-1 text-sm text-zinc-400">Track account status and package usage.</p>
          </div>

          <input
            type="text"
            placeholder="Search by name or email"
            className="h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45] md:w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <th className="pb-3">User</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Joined</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">User ID</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/70 text-zinc-200">
                  <td className="py-4">
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="py-4">{user.plan}</td>
                  <td className="py-4">{user.joinedAt}</td>
                  <td className="py-4">
                    <StatusBadge label={user.status} tone={user.status === "active" ? "success" : "warning"} />
                  </td>
                  <td className="py-4 text-zinc-500">{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h3 className="text-lg font-extrabold">Account Actions</h3>
        <p className="mt-2 text-sm text-zinc-400">Use an account ID to fetch or update status.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            placeholder="Account ID"
            className="h-10 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none transition-colors focus:border-[#d68c45]"
          />
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-[#d68c45]"
            onClick={() => runAction(() => clientApi.get(`/api/admin/accounts/${accountId}`))}
            disabled={!accountId}
          >
            Get Account
          </button>
          <select
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
            className="h-10 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-200"
          >
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="banned">banned</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={() => runAction(() => clientApi.patch(`/api/admin/accounts/${accountId}/ban`))}
            disabled={!accountId}
          >
            Ban
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={() => runAction(() => clientApi.patch(`/api/admin/accounts/${accountId}/unban`))}
            disabled={!accountId}
          >
            Unban
          </button>
          <button
            type="button"
            className="h-10 rounded-full border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-emerald-400 hover:text-emerald-300"
            onClick={() =>
              runAction(() =>
                clientApi.patch(`/api/admin/accounts/${accountId}/status`, {
                  status: statusValue,
                })
              )
            }
            disabled={!accountId}
          >
            Update Status
          </button>
        </div>
      </section>

      <ApiPanel title="Accounts API" data={accounts.data} error={accounts.error} />
      <ApiPanel title="Account Action Result" data={actionResult.data} error={actionResult.error} />
    </section>
  );
}
