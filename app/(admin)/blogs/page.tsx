import StatusBadge from "@/components/admin/StatusBadge";
import { BLOGS } from "@/lib/admin-data";

export default function BlogsPage() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black">Content Management</h2>
        <p className="mt-1 text-sm text-zinc-400">Update blog metadata and publishing state.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <th className="pb-3">Title</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Updated</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {BLOGS.map((blog) => (
              <tr key={blog.id} className="border-b border-zinc-800/70 text-zinc-200">
                <td className="py-4 font-semibold text-white">{blog.title}</td>
                <td className="py-4">{blog.category}</td>
                <td className="py-4">{blog.updatedAt}</td>
                <td className="py-4">
                  <StatusBadge
                    label={blog.status}
                    tone={blog.status === "published" ? "success" : "warning"}
                  />
                </td>
                <td className="py-4 text-zinc-500">{blog.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
