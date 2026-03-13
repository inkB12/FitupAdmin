import StatusBadge from "@/components/admin/StatusBadge";
import { TRANSACTIONS } from "@/lib/admin-data";

export default function TransactionsPage() {
  const totalPaid = TRANSACTIONS.filter((item) => item.status === "paid").length;
  const totalRefunded = TRANSACTIONS.filter((item) => item.status === "refunded").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Paid Transactions</p>
          <p className="mt-2 text-3xl font-black text-white">{totalPaid}</p>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Refunded Transactions</p>
          <p className="mt-2 text-3xl font-black text-white">{totalRefunded}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
        <h2 className="mb-5 text-2xl font-black">Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Package</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Paid At</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/70 text-zinc-200">
                  <td className="py-4 font-semibold text-white">{item.customer}</td>
                  <td className="py-4">{item.packageName}</td>
                  <td className="py-4">{item.amount}</td>
                  <td className="py-4">{item.paidAt}</td>
                  <td className="py-4">
                    <StatusBadge label={item.status} tone={item.status === "paid" ? "success" : "warning"} />
                  </td>
                  <td className="py-4 text-zinc-500">{item.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
