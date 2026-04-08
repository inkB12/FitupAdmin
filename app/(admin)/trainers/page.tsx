"use client";

import { Star } from "lucide-react";
import { useMemo, useState } from "react";

import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { matchesSearch } from "@/lib/admin-ui";
import { TRAINERS } from "@/lib/admin-data";

export default function TrainersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const { debouncedQuery: globalQuery } = useAdminSearch();

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const specialtyOptions = useMemo(
    () => [
      { label: "All specialties", value: "all" },
      ...Array.from(new Set(TRAINERS.map((trainer) => trainer.specialty))).map((specialty) => ({
        label: specialty,
        value: specialty.toLowerCase(),
      })),
    ],
    []
  );

  const filteredTrainers = useMemo(() => {
    return TRAINERS.filter((trainer) => {
      const matchesStatus = statusFilter === "all" || trainer.status === statusFilter;
      const matchesSpecialty =
        specialtyFilter === "all" || trainer.specialty.toLowerCase() === specialtyFilter;

      return matchesStatus && matchesSpecialty && matchesSearch(trainer, combinedQuery);
    });
  }, [combinedQuery, specialtyFilter, statusFilter]);

  const averageRating = useMemo(() => {
    if (TRAINERS.length === 0) {
      return "0.0";
    }

    const total = TRAINERS.reduce((sum, trainer) => sum + trainer.rating, 0);
    return (total / TRAINERS.length).toFixed(1);
  }, []);

  const totalSessions = useMemo(
    () => TRAINERS.reduce((sum, trainer) => sum + trainer.sessions, 0).toLocaleString(),
    []
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Coach Performance"
        title="Trainer Operations"
        description="Surface the coaches, specialties, and workload signals that matter most, then focus the list with search and quick filters."
        stats={[
          { label: "Trainers", value: String(TRAINERS.length), tone: "info" },
          {
            label: "Available now",
            value: String(TRAINERS.filter((trainer) => trainer.status === "available").length),
            tone: "success",
          },
          { label: "Avg rating", value: averageRating, tone: "accent" },
          { label: "Sessions", value: totalSessions, tone: "warning" },
        ]}
      />

      <PageToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search trainer, specialty, or ID"
        resultLabel={`Showing ${filteredTrainers.length} of ${TRAINERS.length} trainers`}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All status", value: "all" },
              { label: "Available", value: "available" },
              { label: "Busy", value: "busy" },
            ],
          },
          {
            label: "Specialty",
            value: specialtyFilter,
            onChange: setSpecialtyFilter,
            options: specialtyOptions,
          },
        ]}
      />

      {filteredTrainers.length === 0 ? (
        <section className="admin-surface rounded-3xl p-6">
          <p className="text-sm font-semibold text-white">No trainers match the current filters.</p>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Try clearing the search or switching the specialty and status filters.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTrainers.map((trainer) => (
            <article key={trainer.id} className="admin-surface rounded-3xl p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">{trainer.name}</p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">{trainer.specialty}</p>
                </div>
                <StatusBadge
                  label={trainer.status}
                  tone={trainer.status === "available" ? "success" : "warning"}
                />
              </div>

              <div className="admin-panel space-y-3 rounded-2xl p-4 text-sm">
                <p className="flex items-center justify-between text-[var(--admin-soft)]">
                  Rating
                  <span className="inline-flex items-center gap-1 font-semibold text-white">
                    <Star className="h-4 w-4 fill-[#f0b35b] text-[#f0b35b]" />
                    {trainer.rating}
                  </span>
                </p>
                <p className="flex items-center justify-between text-[var(--admin-soft)]">
                  Sessions this month
                  <span className="font-semibold text-white">{trainer.sessions}</span>
                </p>
                <p className="flex items-center justify-between text-[var(--admin-soft)]">
                  Trainer ID
                  <span className="font-semibold text-[var(--admin-muted)]">{trainer.id}</span>
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
