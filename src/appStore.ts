import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createAuthSlice } from "./store/authSlice";
import { createDataSlice } from "./store/dataSlice";
import { createUiSlice } from "./store/uiSlice";

import { createErrorHandler } from "./utils/errorHandler";
import type { ErrorHandler } from "./utils/errorHandler";
import type { User, Account, Transaction, NotificationItem } from "./domain/types";
import type { AuthSlice } from "./store/authSlice";
import type { DataSlice } from "./store/dataSlice";
import type { UiSlice } from "./store/uiSlice";

export interface AppState extends AuthSlice, DataSlice, UiSlice {
  users: User[];

  getCurrentUser: () => User | null;
  setCurrentUserId: (id: string) => void;

  saveUser: (user: Partial<User>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  addNotification: (notification: Omit<NotificationItem, "id">) => void;

  exportSnapshot: () => {
    currentUserId: string | null;
    accounts: Account[];
    transactions: Transaction[];
    users: User[];
  };

  importSnapshot: (data: any) => {
    ok: boolean;
    message?: string;
  };
}

let globalErrorHandler: ErrorHandler | undefined;

export const initializeStore = (
  toastAdd: (type: "error" | "warning" | "info", message: string) => void
) => {
  globalErrorHandler = createErrorHandler(toastAdd);

  const useStore = create<AppState>()(
    persist(
      (...a) => {
    const [set, get] = a;

    return {
      ...createAuthSlice(...a),
      ...createDataSlice(globalErrorHandler)(...a),
      ...createUiSlice(...a),

      users: [],

      getCurrentUser: () => get().currentUser,

      setCurrentUserId: (id: string) => {
        const state = get();
        const user = state.users.find((u) => u.id === id) || null;

        set({
          currentUser: user,
          isAuthenticated: !!user,
        });
      },

      saveUser: async (user) => {
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...user }
            : null,
        }));
      },

      addTransaction: async (transaction) => {
        try {
          await get().createTransaction(transaction);
        } catch (error) {
          globalErrorHandler?.handleError(error, "adding transaction");
          throw error;
        }
      },

      addNotification: (notification) => {
        const newNotif: NotificationItem = {
          ...notification,
          id: Math.random().toString(36).slice(2, 9),
        };

        set((state) => ({
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                notifications: [
                  ...(state.currentUser.notifications || []),
                  newNotif,
                ],
              }
            : null,
        }));
      },

      exportSnapshot: () => {
        const state = get();
        const currentUserId = state.currentUser?.id ?? null;

        return {
          currentUserId,
          accounts: state.accounts,
          transactions: state.transactions,
          users: state.users,
        };
      },

      importSnapshot: (data: any) => {
        try {
          if (typeof data !== "object" || !data) {
            return { ok: false, message: "Invalid data" };
          }

          const users = Array.isArray(data.users) ? data.users : [];
          const currentUser =
            data.currentUserId
              ? users.find((u: any) => u.id === data.currentUserId) || null
              : null;

          set({
            accounts: Array.isArray(data.accounts) ? data.accounts : [],
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
            users,
            currentUser,
            isAuthenticated: !!currentUser,
          });

          return { ok: true };
        } catch (error) {
          return { ok: false, message: "Import failed" };
        }
      },
    };
      },
      {
        name: "finarm-store",
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          accounts: state.accounts,
          transactions: state.transactions,
          incomeSources: state.incomeSources,
          budgets: state.budgets,
          goals: state.goals,
          notifications: state.notifications,
        }),
      }
    )
  );

  return useStore;
};
