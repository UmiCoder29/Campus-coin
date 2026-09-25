export type Role = "STUDENT" | "ADMIN";

export type TransactionType = "EXPENSE" | "INCOME";

export type CategoryType = "EXPENSE" | "INCOME";

export type PaymentMethod =
  | "CASH"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "CAMPUS_CARD"
  | "DIGITAL_WALLET"
  | "BANK_TRANSFER";

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "SEMESTER";

export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
