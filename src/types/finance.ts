export interface IncomeStream {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  streamId: string;
  clientName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  isChecked: boolean;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  categoryId: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  isChecked: boolean;
  notes?: string;
  createdAt: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export interface UserSettings {
  currency: CurrencyCode;
  darkMode: boolean;
  monthlyBudgetGoal?: number;
}

export type DateFilterType = 'current_month' | 'previous_month' | 'custom' | 'all';

export interface DateFilter {
  type: DateFilterType;
  selectedMonth: string; // YYYY-MM
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalStreamsCount: number;
  totalCategoriesCount: number;
  totalClientsCount: number;
  selectedIncomeEntriesCount: number;
  selectedExpenseEntriesCount: number;
  highestEarningStream: { name: string; amount: number } | null;
  highestSpendingCategory: { name: string; amount: number } | null;
}
