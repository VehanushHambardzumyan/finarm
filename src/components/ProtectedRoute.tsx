import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/StoreProvider";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const useStore = useAppStore();

  const currentUser = useStore((state) => state.currentUser);
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isAuthChecked = useStore((state) => state.isAuthChecked);
  const checkAuth = useStore((state) => state.checkAuth);

  useEffect(() => {
    if (!isAuthChecked) {
      checkAuth();
    }
  }, [isAuthChecked, checkAuth]);

  // If we have cached auth from localStorage, show content immediately
  // while auth check runs in background
  if (isAuthenticated && currentUser) {
    return <>{children}</>;
  }

  // No cached auth — wait for the check to complete
  if (!isAuthChecked || isAuthLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
