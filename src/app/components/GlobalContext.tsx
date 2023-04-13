import React, { createContext, useContext } from 'react';

const GlobalContext = createContext<{
  // TODO: fill out
} | null>(null);

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
