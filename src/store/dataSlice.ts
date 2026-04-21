import type { StateCreator } from 'zustand';
import { apiClient } from '../api/client';
import type { ErrorHandler } from '../utils/errorHandler';
import type {
  Account,
  Transaction,
  IncomeSource,
  Budget,
  Goal,
  NotificationItem,
} from '../domain/types';

export interface DataSlice {
  // Data state
  accounts: Account[];
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  budgets: Budget[];
  goals: Goal[];
  notifications: NotificationItem[];

  // Loading states
  isLoadingAccounts: boolean;
  isLoadingTransactions: boolean;
  isLoadingIncomeSources: boolean;
  isLoadingBudgets: boolean;
  isLoadingGoals: boolean;
  isLoadingNotifications: boolean;

  // Data actions
  loadAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadIncomeSources: () => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadNotifications: () => Promise<void>;

  createAccount: (
    account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  archiveAccount: (id: string) => Promise<void>;
  unarchiveAccount: (id: string) => Promise<void>;

  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  createIncomeSource: (incomeSource: Omit<IncomeSource, 'id'>) => Promise<void>;
  updateIncomeSource: (id: string, incomeSource: Partial<IncomeSource>) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;

  createBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  createGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;

  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const createDataSlice =
  (errorHandler?: ErrorHandler): StateCreator<DataSlice> =>
  (set, get) => ({
    accounts: [],
    transactions: [],
    incomeSources: [],
    budgets: [],
    goals: [],
    notifications: [],

    isLoadingAccounts: false,
    isLoadingTransactions: false,
    isLoadingIncomeSources: false,
    isLoadingBudgets: false,
    isLoadingGoals: false,
    isLoadingNotifications: false,

    loadAccounts: async () => {
      try {
        set({ isLoadingAccounts: true });
        const accounts = await apiClient.getAccounts();
        set({ accounts, isLoadingAccounts: false });
      } catch (error) {
        set({ isLoadingAccounts: false });
        errorHandler?.handleError(error, 'loading accounts');
        throw error;
      }
    },

    loadTransactions: async () => {
      try {
        set({ isLoadingTransactions: true });
        const transactions = await apiClient.getTransactions();
        set({ transactions, isLoadingTransactions: false });
      } catch (error) {
        set({ isLoadingTransactions: false });
        console.error('Load transactions error:', error);
        throw error;
      }
    },

    loadIncomeSources: async () => {
      try {
        set({ isLoadingIncomeSources: true });
        const incomeSources = await apiClient.getIncomeSources();
        set({ incomeSources, isLoadingIncomeSources: false });
      } catch (error) {
        set({ isLoadingIncomeSources: false });
        console.error('Load income sources error:', error);
        throw error;
      }
    },

    loadBudgets: async () => {
      try {
        set({ isLoadingBudgets: true });
        const budgets = await apiClient.getBudgets();
        set({ budgets, isLoadingBudgets: false });
      } catch (error) {
        set({ isLoadingBudgets: false });
        console.error('Load budgets error:', error);
        throw error;
      }
    },

    loadGoals: async () => {
      try {
        set({ isLoadingGoals: true });
        const goals = await apiClient.getGoals();
        set({ goals, isLoadingGoals: false });
      } catch (error) {
        set({ isLoadingGoals: false });
        console.error('Load goals error:', error);
        throw error;
      }
    },

    loadNotifications: async () => {
      try {
        set({ isLoadingNotifications: true });
        const notifications = await apiClient.getNotifications();
        set({ notifications, isLoadingNotifications: false });
      } catch (error) {
        set({ isLoadingNotifications: false });
        console.error('Load notifications error:', error);
        throw error;
      }
    },

    createAccount: async (account) => {
      try {
        const payload = {
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: account.balance ?? 0,
          creditLimit: account.creditLimit ?? undefined,
        };

        await apiClient.createAccount(payload);
        await get().loadAccounts();
      } catch (error) {
        errorHandler?.handleError(error, 'creating account');
        throw error;
      }
    },

    updateAccount: async (id, account) => {
      try {
        const payload: Record<string, unknown> = {
          ...account,
        };

        if (account.balance !== undefined) {
          payload.initialBalance = account.balance;
          delete payload.balance;
        }

        await apiClient.updateAccount(id, payload);
        await get().loadAccounts();
      } catch (error) {
        console.error('Update account error:', error);
        throw error;
      }
    },

    deleteAccount: async (id) => {
      try {
        await apiClient.deleteAccount(id);
        await get().loadAccounts();
      } catch (error) {
        console.error('Delete account error:', error);
        throw error;
      }
    },

    archiveAccount: async (id) => {
      try {
        await apiClient.archiveAccount(id);
        await get().loadAccounts();
      } catch (error) {
        console.error('Archive account error:', error);
        throw error;
      }
    },

    unarchiveAccount: async (id) => {
      try {
        await apiClient.unarchiveAccount(id);
        await get().loadAccounts();
      } catch (error) {
        console.error('Unarchive account error:', error);
        throw error;
      }
    },

    createTransaction: async (transaction) => {
      try {
        await apiClient.createTransaction(transaction);
        await get().loadTransactions();
        await get().loadAccounts();
      } catch (error) {
        console.error('Create transaction error:', error);
        throw error;
      }
    },

    updateTransaction: async (id, transaction) => {
      try {
        await apiClient.updateTransaction(id, transaction);
        await get().loadTransactions();
        await get().loadAccounts();
      } catch (error) {
        console.error('Update transaction error:', error);
        throw error;
      }
    },

    deleteTransaction: async (id) => {
      try {
        await apiClient.deleteTransaction(id);
        await get().loadTransactions();
        await get().loadAccounts();
      } catch (error) {
        console.error('Delete transaction error:', error);
        throw error;
      }
    },

    createIncomeSource: async (incomeSource) => {
      try {
        const newIncomeSource = await apiClient.createIncomeSource(incomeSource);
        set((state) => ({
          incomeSources: [...state.incomeSources, newIncomeSource],
        }));
      } catch (error) {
        console.error('Create income source error:', error);
        throw error;
      }
    },

    updateIncomeSource: async (id, incomeSource) => {
      try {
        const updatedIncomeSource = await apiClient.updateIncomeSource(
          id,
          incomeSource
        );
        set((state) => ({
          incomeSources: state.incomeSources.map((i) =>
            i.id === id ? updatedIncomeSource : i
          ),
        }));
      } catch (error) {
        console.error('Update income source error:', error);
        throw error;
      }
    },

    deleteIncomeSource: async (id) => {
      try {
        await apiClient.deleteIncomeSource(id);
        set((state) => ({
          incomeSources: state.incomeSources.filter((i) => i.id !== id),
        }));
      } catch (error) {
        console.error('Delete income source error:', error);
        throw error;
      }
    },

    createBudget: async (budget) => {
      try {
        const newBudget = await apiClient.createBudget(budget);
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));
      } catch (error) {
        console.error('Create budget error:', error);
        throw error;
      }
    },

    updateBudget: async (id, budget) => {
      try {
        const updatedBudget = await apiClient.updateBudget(id, budget);
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? updatedBudget : b)),
        }));
      } catch (error) {
        console.error('Update budget error:', error);
        throw error;
      }
    },

    deleteBudget: async (id) => {
      try {
        await apiClient.deleteBudget(id);
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      } catch (error) {
        console.error('Delete budget error:', error);
        throw error;
      }
    },

    createGoal: async (goal) => {
      try {
        const newGoal = await apiClient.createGoal(goal);
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      } catch (error) {
        console.error('Create goal error:', error);
        throw error;
      }
    },

    updateGoal: async (id, goal) => {
      try {
        const updatedGoal = await apiClient.updateGoal(id, goal);
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        }));
      } catch (error) {
        console.error('Update goal error:', error);
        throw error;
      }
    },

    deleteGoal: async (id) => {
      try {
        await apiClient.deleteGoal(id);
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      } catch (error) {
        console.error('Delete goal error:', error);
        throw error;
      }
    },

    contributeToGoal: async (id, amount) => {
      try {
        const updatedGoal = await apiClient.contributeToGoal(id, amount);
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        }));
      } catch (error) {
        console.error('Contribute to goal error:', error);
        throw error;
      }
    },

    markNotificationAsRead: async (id) => {
      try {
        const updatedNotification = await apiClient.markNotificationAsRead(id);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? updatedNotification : n
          ),
        }));
      } catch (error) {
        console.error('Mark notification as read error:', error);
        throw error;
      }
    },

    deleteNotification: async (id) => {
      try {
        await apiClient.deleteNotification(id);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      } catch (error) {
        console.error('Delete notification error:', error);
        throw error;
      }
    },
  });