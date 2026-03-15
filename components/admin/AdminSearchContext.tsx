import { createContext, useContext } from "react";

type AdminSearchContextValue = {
  query: string;
  debouncedQuery: string;
  setQuery: (value: string) => void;
};

const AdminSearchContext = createContext<AdminSearchContextValue | undefined>(undefined);

export function AdminSearchProvider({
  value,
  children,
}: {
  value: AdminSearchContextValue;
  children: React.ReactNode;
}) {
  return <AdminSearchContext.Provider value={value}>{children}</AdminSearchContext.Provider>;
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error("useAdminSearch must be used within AdminSearchProvider");
  }
  return context;
}
