import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { initializeStore } from "../appStore";
import { useToast } from "../components/ToastProvider";

const StoreContext = createContext<ReturnType<typeof initializeStore> | undefined>(undefined);

export const useAppStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within a StoreProvider");
  }

  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { addToast } = useToast();
  const [store] = useState(() => initializeStore(addToast));

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}