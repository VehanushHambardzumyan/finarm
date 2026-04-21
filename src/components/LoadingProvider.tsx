import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setLoading: (isLoading: boolean, message?: string) => void;
  startLoading: (message?: string) => () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  const setLoading = (isLoading: boolean, message?: string) => {
    setLoadingState({ isLoading, loadingMessage: message });
  };

  const startLoading = (message?: string) => {
    setLoading(true, message);
    return () => setLoading(false);
  };

  const value = useMemo(
    () => ({
      loadingState,
      setLoading,
      startLoading,
    }),
    [loadingState]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};
export const accountMeta: Record<
  string, { icon: string; label: string; accentClass: string; }
> = {
  cash: { icon: "💵", label: "Cash Wallet", accentClass: "cash" },
  bank: { icon: "🏦", label: "Bank Account", accentClass: "bank" },
  debit: { icon: "💳", label: "Debit Card", accentClass: "debit" },
  credit: { icon: "🧾", label: "Credit Card", accentClass: "credit" },
};
