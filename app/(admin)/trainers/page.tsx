import { Star } from "lucide-react";

import StatusBadge from "@/components/admin/StatusBadge";
import { TRAINERS } from "@/lib/admin-data";

export default function TrainersPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-black">Trainer Operations</h2>
        <p className="mt-1 text-sm text-zinc-400">Manage PT availability and quality metrics.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TRAINERS.map((trainer) => (
          <article key={trainer.id} className="rounded-3xl border border-zinc-800 bg-[#121212] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-white">{trainer.name}</p>
                <p className="text-sm text-zinc-400">{trainer.specialty}</p>
              </div>
              <StatusBadge
                label={trainer.status}
                tone={trainer.status === "available" ? "success" : "warning"}
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
              <p className="flex items-center justify-between text-zinc-300">
                Rating
                <span className="inline-flex items-center gap-1 font-semibold text-white">
                  <Star className="h-4 w-4 fill-[#d68c45] text-[#d68c45]" />
                  {trainer.rating}
                </span>
              </p>
              <p className="flex items-center justify-between text-zinc-300">
                Sessions this month
                <span className="font-semibold text-white">{trainer.sessions}</span>
              </p>
              <p className="flex items-center justify-between text-zinc-300">
                Trainer ID
                <span className="font-semibold text-zinc-400">{trainer.id}</span>
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
