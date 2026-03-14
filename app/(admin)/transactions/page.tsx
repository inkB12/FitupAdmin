"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import StatusBadge from "@/components/admin/StatusBadge";
import { TRANSACTIONS } from "@/lib/admin-data";

type TransactionRow = {
  id: string;
  customer: string;
  packageName: string;
  amount: string;
  paidAt: string;
  status: "paid" | "refunded";
};

type ModalState = {
  mode: "create" | "edit" | null;
  rowId: string | null;
  values: TransactionRow;
};

const emptyDraft: TransactionRow = {
  id: "",
  customer: "",
  packageName: "",
  amount: "",
  paidAt: "",
  status: "paid",
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<TransactionRow[]>(TRANSACTIONS);
  const [modal, setModal] = useState<ModalState>({ mode: null, rowId: null, values: emptyDraft });

  const totals = useMemo(() => {
    const totalPaid = rows.filter((item) => item.status === "paid").length;
    const totalRefunded = rows.filter((item) => item.status === "refunded").length;
    return { totalPaid, totalRefunded };
  }, [rows]);

  const openCreate = () => {
    setModal({ mode: "create", rowId: null, values: emptyDraft });
  };

  const openEdit = (row: TransactionRow) => {
    setModal({ mode: "edit", rowId: row.id, values: row });
  };

  const closeModal = () => {
    setModal({ mode: null, rowId: null, values: emptyDraft });
  };

  const saveModal = () => {
    if (modal.mode === "create") {
      if (!modal.values.customer) {
        return;
      }
      setRows((prev) => [modal.values, ...prev]);
    }
    if (modal.mode === "edit" && modal.rowId) {
      setRows((prev) => prev.map((row) => (row.id === modal.rowId ? modal.values : row)));
    }
    closeModal();
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Paid Transactions</p>
          <p className="mt-2 text-3xl font-black text-white">{totals.totalPaid}</p>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Refunded Transactions</p>
          <p className="mt-2 text-3xl font-black text-white">{totals.totalRefunded}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">Transactions</h2>
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
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Package</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Paid At</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/70 text-zinc-200">
                  <td className="py-3 font-semibold text-white">{item.customer}</td>
                  <td className="py-3">{item.packageName}</td>
                  <td className="py-3">{item.amount}</td>
                  <td className="py-3">{item.paidAt}</td>
                  <td className="py-3">
                    <StatusBadge label={item.status} tone={item.status === "paid" ? "success" : "warning"} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-emerald-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal.mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-extrabold">
                {modal.mode === "create" ? "Create Transaction" : "Update Transaction"}
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
              <label className="grid gap-2 text-xs text-zinc-400">
                Customer
                <input
                  value={modal.values.customer}
                  onChange={(event) => setModal((prev) => ({ ...prev, values: { ...prev.values, customer: event.target.value } }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Package
                <input
                  value={modal.values.packageName}
                  onChange={(event) => setModal((prev) => ({ ...prev, values: { ...prev.values, packageName: event.target.value } }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Amount
                <input
                  value={modal.values.amount}
                  onChange={(event) => setModal((prev) => ({ ...prev, values: { ...prev.values, amount: event.target.value } }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Paid At
                <input
                  value={modal.values.paidAt}
                  onChange={(event) => setModal((prev) => ({ ...prev, values: { ...prev.values, paidAt: event.target.value } }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-400">
                Status
                <select
                  value={modal.values.status}
                  onChange={(event) => setModal((prev) => ({ ...prev, values: { ...prev.values, status: event.target.value as TransactionRow["status"] } }))}
                  className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
                >
                  <option value="paid">paid</option>
                  <option value="refunded">refunded</option>
                </select>
              </label>
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
    </div>
  );
}
