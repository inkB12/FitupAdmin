import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "neutral" | "danger";
};

export default function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
        tone === "success" &&
          "border-emerald-400/40 bg-emerald-400/12 text-emerald-100",
        tone === "warning" &&
          "border-amber-400/40 bg-amber-400/12 text-amber-100",
        tone === "danger" &&
          "border-rose-400/40 bg-rose-400/12 text-rose-100",
        tone === "neutral" && "border-sky-400/30 bg-sky-400/10 text-sky-100"
      )}
    >
      {label}
    </span>
  );
}
