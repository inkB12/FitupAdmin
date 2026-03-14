type ApiPanelProps = {
  title: string;
  data: unknown;
  error?: string | null;
};

export default function ApiPanel({ title, data, error }: ApiPanelProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#121212] p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Live API
        </span>
      </div>
      {error ? (
        <p className="text-sm text-amber-300">
          Unable to load data. {error}
        </p>
      ) : (
        <pre className="max-h-[420px] overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}
