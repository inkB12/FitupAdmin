import StatusBadge from "@/components/admin/StatusBadge";
import { USERS } from "@/lib/admin-data";

export default function UsersPage() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
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
    </section>
  );
}
