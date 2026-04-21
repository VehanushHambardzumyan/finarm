import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/StoreProvider";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const useStore = useAppStore();
  const user = useStore((state: any) => state.user);
  const token = useStore((state: any) => state.token);
  const loading =
    useStore((state: any) => state.isLoading ?? state.loading ?? false);

  const isAuthenticated = Boolean(user || token);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}