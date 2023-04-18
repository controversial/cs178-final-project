import React, { createContext, useContext } from 'react';

interface IGlobalContext {
  filters: Record<string, string[]>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const GlobalContext = createContext<IGlobalContext | null>(null);

export function GlobalContextProvider({
  children,
  ...props
}: NonNullable<React.ContextType<typeof GlobalContext>> & { children: React.ReactNode }) {
  return (
    <GlobalContext.Provider value={props}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  return context;
}
