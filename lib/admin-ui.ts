export type DynamicRow = Record<string, unknown>;

export type SelectOption = {
  label: string;
  value: string;
};

const FILTER_KEY_PRIORITIES = [
  "status",
  "role",
  "category",
  "type",
  "plan",
  "service",
  "specialty",
  "level",
  "state",
];

export function buildPageNumbers(current: number, total: number) {
  if (total <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);

  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page > 1 && page < total) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

export function formatFieldLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getDisplayText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function matchesSearch(value: unknown, term: string) {
  if (!term) {
    return true;
  }

  return getDisplayText(value).toLowerCase().includes(term.toLowerCase());
}

export function findDynamicFilterKey(columns: string[]) {
  for (const priority of FILTER_KEY_PRIORITIES) {
    const match = columns.find((column) => {
      const normalized = column.toLowerCase();
      return normalized === priority || normalized.includes(priority);
    });

    if (match) {
      return match;
    }
  }

  return columns[0] ?? null;
}

export function buildFilterOptions(
  rows: DynamicRow[],
  filterKey: string | null,
  allLabel?: string
): SelectOption[] {
  if (!filterKey) {
    return [{ label: allLabel ?? "All items", value: "all" }];
  }

  const values = Array.from(
    new Set(
      rows
        .map((row) => getDisplayText(row[filterKey]).trim())
        .filter(Boolean)
    )
  )
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 12);

  return [
    { label: allLabel ?? `All ${formatFieldLabel(filterKey)}`, value: "all" },
    ...values.map((value) => ({ label: value, value: value.toLowerCase() })),
  ];
}

export function matchesFilter(row: DynamicRow, filterKey: string | null, filterValue: string) {
  if (!filterKey || filterValue === "all") {
    return true;
  }

  return getDisplayText(row[filterKey]).trim().toLowerCase() === filterValue.toLowerCase();
}
