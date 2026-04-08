"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildPageNumbers } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary?: string;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  summary,
  className,
}: PaginationProps) {
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className={cn("mt-5 flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-xs text-[var(--admin-muted)]">
        {summary ?? `Page ${currentPage} of ${totalPages}`}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-3 text-xs font-semibold text-white transition-colors hover:border-[#f0b35b]/70 hover:text-[#ffe2a3] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors",
              pageNumber === currentPage
                ? "border-[#f0b35b]/80 bg-[#f0b35b]/12 text-[#ffe2a3]"
                : "border-white/12 bg-white/[0.03] text-white hover:border-[#7ed9ff]/60 hover:text-[#dff6ff]"
            )}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-white/12 bg-white/[0.03] px-3 text-xs font-semibold text-white transition-colors hover:border-[#f0b35b]/70 hover:text-[#ffe2a3] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
