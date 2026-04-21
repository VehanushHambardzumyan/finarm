export type Currency = "AMD" | "USD" | "EUR";
export const currencies = ["AMD", "USD", "EUR"] as const;
export type TransactionType = "income" | "expense" | "transfer";
export type TxType = "income" | "expense" | "transfer";

export type AccountType = "cash" | "bank" | "card" | "savings" | "credit"; 

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  creditLimit?: number | null;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  accountId?: string;
  toAccountId?: string;
  amount: number;
  currency: Currency;
  category?: string;
  txDate: string;
  note?: string;
  recurringId?: string;
  meta?: Record<string, any>;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  recurring?: boolean;
  lastPosted?: string;
  accountId?: string;
}

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: string;
  limitAmount: number;
}

export interface Budget {
  id: string;
  userId?: string;
  period: BudgetPeriod;
  totalLimit: number;
  categories?: BudgetCategory[];
  createdAt?: string;
}

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Profile {
  age?: number;
  maritalStatus?: string;
  currency?: Currency;
}

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string;
  role: "user" | "admin";
  profile: Profile;
}