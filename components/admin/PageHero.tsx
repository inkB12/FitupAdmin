"use client";

import { cn } from "@/lib/utils";

type HeroTone = "accent" | "info" | "success" | "warning" | "neutral";

type HeroStat = {
  label: string;
  value: string;
  tone?: HeroTone;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  stats?: HeroStat[];
};

const toneMap: Record<HeroTone, string> = {
  accent: "border-[#f0b35b]/30 bg-[#f0b35b]/10 text-[#ffe0a8]",
  info: "border-[#7ed9ff]/30 bg-[#7ed9ff]/10 text-[#dff6ff]",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  neutral: "border-white/12 bg-white/[0.04] text-white",
};

export default function PageHero({
  eyebrow = "FITUP Control",
  title,
  description,
  stats = [],
}: PageHeroProps) {
  return (
    <section className="admin-surface relative overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,179,91,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(126,217,255,0.15),transparent_28%)]" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="admin-kicker">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--admin-muted)] md:text-base">
            {description}
          </p>
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            {stats.map((item) => (
              <article
                key={`${item.label}-${item.value}`}
                className={cn(
                  "rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm",
                  toneMap[item.tone ?? "neutral"]
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
