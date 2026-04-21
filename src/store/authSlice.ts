import type { StateCreator } from "zustand";
import { apiClient } from "../api/client";
import type { User } from "../domain/types";

export interface AuthSlice {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthChecked: boolean;

  login: (
    identifier: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string; code?: string }>;

  register: (payload: {
    email?: string;
    phone?: string;
    password: string;
    name: string;
  }) => Promise<{ ok: boolean; message?: string; code?: string }>;

  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; profile?: Record<string, any> }) => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  currentUser: null,
  isAuthenticated: false,
  isAuthLoading: false,
  isAuthChecked: false,

  login: async (identifier, password) => {
    try {
      set({ isAuthLoading: true });

      const data = await apiClient.login({ identifier, password });

      set({
        currentUser: data?.user ?? null,
        isAuthenticated: !!data?.user,
        isAuthLoading: false,
        isAuthChecked: true,
      });

      return {
        ok: true,
        message: data?.message,
      };
    } catch (error: unknown) {
      const err = error as { code?: string; status?: number; message?: string };

      set({ isAuthLoading: false });

      if (err.code === "NETWORK_ERROR") {
        return { ok: false, message: "auth.serverUnavailable" };
      }

      if (err.status === 401) {
        return { ok: false, message: "auth.invalidCredentials" };
      }

      return { ok: false, message: "auth.unknownError" };
    }
  },

  register: async ({ email, phone, password, name }) => {
    try {
      set({ isAuthLoading: true });

      await apiClient.register({
        email,
        phone,
        password,
        name,
      });

      set({
        isAuthLoading: false,
        isAuthChecked: false,
      });

      return { ok: true };
    } catch (error: any) {
      set({ isAuthLoading: false });

      const message =
        error?.code === "NETWORK_ERROR"
          ? "auth.serverUnavailable"
          : "auth.registrationFailed";

      return { ok: false, message, code: error?.code };
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    set({
      currentUser: null,
      isAuthenticated: false,
      isAuthChecked: true,
      isAuthLoading: false,
    });
  },

  checkAuth: async () => {
    try {
      set({ isAuthLoading: true });

      await apiClient.bootstrapAuth();
      const user = await apiClient.getMe();

      set({
        currentUser: user,
        isAuthenticated: true,
        isAuthLoading: false,
        isAuthChecked: true,
      });
    } catch {
      set({
        currentUser: null,
        isAuthenticated: false,
        isAuthLoading: false,
        isAuthChecked: true,
      });
    }
  },

  refreshAuth: async () => {
    try {
      const user = await apiClient.getMe();

      set({
        currentUser: user,
        isAuthenticated: true,
        isAuthChecked: true,
      });
    } catch {
      set({
        currentUser: null,
        isAuthenticated: false,
        isAuthChecked: true,
      });
    }
  },

  updateProfile: async (data) => {
    const updated = await apiClient.updateMe(data);
    set({ currentUser: updated });
  },
});