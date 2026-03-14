type ApiStatusProps = {
  label: string;
  checked: boolean;
  error: string | null;
};

export default function ApiStatus({ label, checked, error }: ApiStatusProps) {
  if (!checked) {
    return null;
  }

  const isOk = !error;
  const tone = isOk
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : "border-amber-500/40 bg-amber-500/10 text-amber-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <span className="font-semibold">{label}:</span>{" "}
      {isOk ? "Connected" : `Not connected. ${error}`}
    </div>
  );
}
