const packageRows = [
  {
    name: "Basic",
    price: "$19 / month",
    activeUsers: 28390,
    description: "AI training schedule and progress tracking.",
  },
  {
    name: "Optimize",
    price: "$39 / month",
    activeUsers: 56312,
    description: "Fully personalized training and nutrition plan.",
  },
  {
    name: "Premium",
    price: "$69 / month",
    activeUsers: 19890,
    description: "Includes 1:1 trainer support and priority care.",
  },
];

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Packages</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage plan tiers, pricing, and active subscribers.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {packageRows.map((item) => (
          <article key={item.name} className="rounded-3xl border border-zinc-800 bg-[#121212] p-6">
            <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Plan</p>
            <h3 className="mt-1 text-2xl font-black text-white">{item.name}</h3>
            <p className="mt-2 text-[#d68c45]">{item.price}</p>
            <p className="mt-4 text-sm text-zinc-400">{item.description}</p>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">Active Users</p>
              <p className="mt-1 text-xl font-bold text-white">{item.activeUsers.toLocaleString()}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
