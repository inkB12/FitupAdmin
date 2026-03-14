type ApiPanelProps = {
  title: string;
  data: unknown;
  error?: string | null;
};

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export default function ApiPanel({ title, data, error }: ApiPanelProps) {
  const isArray = Array.isArray(data);
  const isObject = data !== null && typeof data === "object" && !isArray;
  const arrayItems = isArray ? (data as unknown[]) : [];
  const objectItems = isObject ? (data as Record<string, unknown>) : null;
  const tableColumns =
    arrayItems.length > 0 && typeof arrayItems[0] === "object" && arrayItems[0] !== null
      ? Object.keys(arrayItems[0] as Record<string, unknown>).slice(0, 6)
      : [];

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
      ) : arrayItems.length > 0 && tableColumns.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.08em] text-zinc-500">
                {tableColumns.map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arrayItems.slice(0, 10).map((item, index) => {
                const row = item as Record<string, unknown>;
                return (
                  <tr key={index} className="border-b border-zinc-800/60 text-zinc-200">
                    {tableColumns.map((column) => (
                      <td key={column} className="px-4 py-3 text-xs text-zinc-200">
                        {renderValue(row[column])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : isObject && objectItems ? (
        <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
          {Object.entries(objectItems).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-6">
              <span className="text-xs uppercase tracking-[0.08em] text-zinc-500">{key}</span>
              <span className="text-right text-zinc-100">{renderValue(value)}</span>
            </div>
          ))}
        </div>
      ) : arrayItems.length > 0 ? (
        <ul className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-200">
          {arrayItems.slice(0, 10).map((item, index) => (
            <li key={index} className="border-b border-zinc-800/60 pb-2 last:border-b-0 last:pb-0">
              {renderValue(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400">No data available.</p>
      )}
    </section>
  );
}
