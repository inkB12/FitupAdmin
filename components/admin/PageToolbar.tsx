"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import type { SelectOption } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export type ToolbarFilter = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

type PageToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ToolbarFilter[];
  actions?: ReactNode;
  resultLabel?: string;
  className?: string;
};

export default function PageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  actions,
  resultLabel,
  className,
}: PageToolbarProps) {
  return (
    <section className={cn("admin-panel p-4 md:p-5", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm text-[var(--admin-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <Search className="h-4 w-4 text-[var(--admin-accent)]" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[color:rgba(142,163,184,0.72)]"
            />
          </label>

          {filters.map((filter) => (
            <label
              key={filter.label}
              className="grid min-w-[190px] gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]"
            >
              <span className="inline-flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {filter.label}
              </span>
              <select
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                className="h-12 rounded-2xl border border-white/12 bg-[#0d1724]/90 px-4 text-sm font-medium normal-case tracking-normal text-white outline-none transition-colors focus:border-[#f0b35b]/80"
              >
                {filter.options.map((option) => (
                  <option key={`${filter.label}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {(resultLabel || actions) ? (
          <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
            {resultLabel ? <p className="text-xs text-[var(--admin-muted)]">{resultLabel}</p> : null}
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
