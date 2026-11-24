import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Percent,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  FolderTree,
  Calendar,
  Sparkles,
  Cloud,
  LogIn,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  calculateCategoryTotal,
  calculateStreamTotal,
  formatCurrency,
  formatMonthDisplay,
  formatPercentage,
  isDateInFilter,
} from '../utils/finance';

export const Overview: React.FC = () => {
  const {
    streams,
    categories,
    incomeEntries,
    expenseEntries,
    metrics,
    settings,
    dateFilter,
    toggleIncomeEntry,
    toggleExpenseEntry,
    setActiveTab,
    user,
    signInWithGoogle,
  } = useFinance();

  // Filter entries according to dateFilter
  const filteredIncome = incomeEntries.filter((e) => isDateInFilter(e.date, dateFilter));
  const filteredExpenses = expenseEntries.filter((e) => isDateInFilter(e.date, dateFilter));

  const budgetGoal = settings.monthlyBudgetGoal || 50000;
  const expensePercentageOfBudget = Math.min(
    100,
    Math.round((metrics.totalExpenses / budgetGoal) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Hero Financial Health Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-xs font-medium text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {dateFilter.type === 'all'
                  ? 'All Historical Financial Records'
                  : formatMonthDisplay(dateFilter.selectedMonth)}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
                Calculated Net Balance
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <h2
                  className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${
                    metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(metrics.netProfit, settings.currency)}
                </h2>
                <span
                  className={`text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full ${
                    metrics.netProfit >= 0
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {metrics.netProfit >= 0 ? 'Surplus' : 'Deficit'} (
                  {formatPercentage(metrics.profitMargin)})
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 max-w-xl">
              Calculated dynamically from {metrics.selectedIncomeEntriesCount} checked client invoices and{' '}
              {metrics.selectedExpenseEntriesCount} checked expenses.
            </p>
          </div>

          {/* Quick breakdown mini stats */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="p-4 rounded-2xl bg-neutral-800/70 border border-neutral-700/60">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> Selected Income
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatCurrency(metrics.totalIncome, settings.currency)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {metrics.selectedIncomeEntriesCount} entries active
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-800/70 border border-neutral-700/60">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <TrendingDown className="w-3.5 h-3.5" /> Selected Expenses
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatCurrency(metrics.totalExpenses, settings.currency)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {metrics.selectedExpenseEntriesCount} entries active
              </div>
            </div>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div
          className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
            metrics.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </div>

      {/* Cloud Storage & Persistence Status Banner */}
      {!user ? (
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Want your financial data saved permanently?
              </h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                Currently, changes are saved only in this browser's temporary storage. Log in with Google to store your streams, clients, and budget records safely in your personal Google Cloud database.
              </p>
            </div>
          </div>
          <button
            onClick={signInWithGoogle}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 shrink-0 shadow-2xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Save Cloud Data</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              Signed in as <strong className="text-neutral-900 dark:text-white">{user.email}</strong>
            </span>
            <span className="hidden md:inline text-neutral-400">• All data is continuously saved to your private Google Cloud database</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Firestore Active
          </span>
        </div>
      )}

      {/* Budget Goal Tracker */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            Monthly Expense Budget Cap
          </span>
          <span className="font-mono text-neutral-500">
            {formatCurrency(metrics.totalExpenses, settings.currency)} /{' '}
            {formatCurrency(budgetGoal, settings.currency)} ({expensePercentageOfBudget}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              expensePercentageOfBudget > 90
                ? 'bg-rose-500'
                : expensePercentageOfBudget > 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, expensePercentageOfBudget)}%` }}
          />
        </div>
      </div>

      {/* Interactive Checkbox Scenario Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Streams Checkbox Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Income Streams Quick Check
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Click checkboxes to simulate income scenarios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('income')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {filteredIncome.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No income entries recorded for this period.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/70 max-h-72 overflow-y-auto mt-2">
                {filteredIncome.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 rounded-lg transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.isChecked}
                        onChange={() => toggleIncomeEntry(item.id)}
                        aria-label={`Toggle income entry ${item.clientName}`}
                        className="w-4 h-4 rounded-sm border-2 border-neutral-300 dark:border-neutral-600 text-emerald-600 accent-emerald-600 cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium truncate ${
                          item.isChecked
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400 line-through'
                        }`}
                      >
                        {item.clientName}
                      </span>
                    </label>

                    <span
                      className={`text-xs font-bold font-mono ml-2 shrink-0 ${
                        item.isChecked
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {formatCurrency(item.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Selected Income Total:</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(metrics.totalIncome, settings.currency)}
            </span>
          </div>
        </div>

        {/* Expenses Categories Checkbox Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Expense Items Quick Check
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Click checkboxes to simulate cost scenarios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No expense entries recorded for this period.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/70 max-h-72 overflow-y-auto mt-2">
                {filteredExpenses.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 rounded-lg transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.isChecked}
                        onChange={() => toggleExpenseEntry(item.id)}
                        aria-label={`Toggle expense entry ${item.name}`}
                        className="w-4 h-4 rounded-sm border-2 border-neutral-300 dark:border-neutral-600 text-rose-600 accent-rose-600 cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium truncate ${
                          item.isChecked
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400 line-through'
                        }`}
                      >
                        {item.name}
                      </span>
                    </label>

                    <span
                      className={`text-xs font-bold font-mono ml-2 shrink-0 ${
                        item.isChecked ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400'
                      }`}
                    >
                      {formatCurrency(item.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Selected Expense Total:</span>
            <span className="font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrency(metrics.totalExpenses, settings.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
