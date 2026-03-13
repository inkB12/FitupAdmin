import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "neutral";
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
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        tone === "warning" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-300",
        tone === "neutral" && "border-zinc-700 bg-zinc-800/70 text-zinc-300"
      )}
    >
      {label}
    </span>
  );
}
