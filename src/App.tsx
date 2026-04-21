import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "./store/StoreProvider";

import Header from "./components/Header";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingProvider } from "./components/LoadingProvider";
import { GlobalLoadingSpinner } from "./components/GlobalLoadingSpinner";
import { ToastProvider } from "./components/ToastProvider";
import { ToastContainer } from "./components/ToastContainer";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Admin from "./pages/AdminDashboard";

import { StoreProvider } from "./store/StoreProvider";

function AuthExpiredHandler() {
  const navigate = useNavigate();
  const useStore = useAppStore();
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    const handler = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [logout, navigate]);

  return null;
}

function AppContent() {
  return (
    <BrowserRouter>
      <AuthExpiredHandler />
      <Routes>
        {/* Standalone auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main app shell for authenticated/internal pages */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <Layout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/dashboard" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounts"
                    element={
                      <ProtectedRoute>
                        <Accounts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <Transactions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/income"
                    element={
                      <ProtectedRoute>
                        <Income />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute>
                        <Expenses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRoute>
                        <Budgets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/goals"
                    element={
                      <ProtectedRoute>
                        <Goals />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StoreProvider>
          <LoadingProvider>
            <AppContent />
            <GlobalLoadingSpinner />
            <ToastContainer />
          </LoadingProvider>
        </StoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}