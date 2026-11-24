import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  FolderTree,
  Users,
  CheckSquare,
  Award,
  AlertTriangle,
  PieChart as PieIcon,
  BarChart2,
  LineChart as LineIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import {
  calculateCategoryTotal,
  calculateStreamTotal,
  formatCurrency,
  formatMonthDisplay,
  formatPercentage,
  isDateInFilter,
} from '../utils/finance';

const INCOME_COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#047857', '#a7f3d0'];
const EXPENSE_COLORS = ['#ef4444', '#f87171', '#dc2626', '#b91c1c', '#fca5a5', '#991b1b'];

export const Dashboard: React.FC = () => {
  const {
    streams,
    incomeEntries,
    categories,
    expenseEntries,
    metrics,
    settings,
    dateFilter,
  } = useFinance();

  // Active entries filtered by date range
  const filteredIncome = useMemo(() => {
    return incomeEntries.filter((e) => isDateInFilter(e.date, dateFilter));
  }, [incomeEntries, dateFilter]);

  const filteredExpenses = useMemo(() => {
    return expenseEntries.filter((e) => isDateInFilter(e.date, dateFilter));
  }, [expenseEntries, dateFilter]);

  // 1. Income distribution data (by stream, only checked)
  const incomePieData = useMemo(() => {
    return streams
      .map((stream, idx) => {
        const total = calculateStreamTotal(stream.id, filteredIncome);
        return {
          name: stream.name,
          value: total,
          color: stream.color || INCOME_COLORS[idx % INCOME_COLORS.length],
        };
      })
      .filter((d) => d.value > 0);
  }, [streams, filteredIncome]);

  // 2. Expense distribution data (by category, only checked)
  const expensePieData = useMemo(() => {
    return categories
      .map((cat, idx) => {
        const total = calculateCategoryTotal(cat.id, filteredExpenses);
        return {
          name: cat.name,
          value: total,
          color: cat.color || EXPENSE_COLORS[idx % EXPENSE_COLORS.length],
        };
      })
      .filter((d) => d.value > 0);
  }, [categories, filteredExpenses]);

  // 3. Income vs Expense comparison bar data
  const comparisonBarData = useMemo(() => {
    return [
      {
        name: 'Selected Financials',
        Income: metrics.totalIncome,
        Expenses: metrics.totalExpenses,
        Net: metrics.netProfit,
      },
    ];
  }, [metrics]);

  // 4. Monthly Trend Data (group by month from all entries, sorted chronologically)
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, { month: string; income: number; expenses: number; net: number }>();

    // Process all checked income
    incomeEntries.forEach((entry) => {
      if (!entry.isChecked || !entry.date) return;
      const monthKey = entry.date.substring(0, 7); // YYYY-MM
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthKey, income: 0, expenses: 0, net: 0 });
      }
      const data = monthMap.get(monthKey)!;
      data.income += Number(entry.amount) || 0;
      data.net = data.income - data.expenses;
    });

    // Process all checked expenses
    expenseEntries.forEach((entry) => {
      if (!entry.isChecked || !entry.date) return;
      const monthKey = entry.date.substring(0, 7);
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthKey, income: 0, expenses: 0, net: 0 });
      }
      const data = monthMap.get(monthKey)!;
      data.expenses += Number(entry.amount) || 0;
      data.net = data.income - data.expenses;
    });

    // Sort months chronologically
    return Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        label: formatMonthDisplay(item.month),
      }));
  }, [incomeEntries, expenseEntries]);

  // Custom Recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-neutral-900 text-white p-3 shadow-xl border border-neutral-800 text-xs font-sans">
          <p className="font-semibold text-neutral-300 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold">
                {formatCurrency(entry.value, settings.currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Selected Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Selected Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalIncome, settings.currency)}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {metrics.selectedIncomeEntriesCount} of {metrics.totalClientsCount} clients selected
            </p>
          </div>
        </div>

        {/* Total Selected Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Selected Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.totalExpenses, settings.currency)}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {metrics.selectedExpenseEntriesCount} of {filteredExpenses.length} expenses selected
            </p>
          </div>
        </div>

        {/* Net Profit or Loss */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Net Profit / Loss
            </span>
            <div
              className={`p-2 rounded-xl ${
                metrics.netProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
              }`}
            >
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                metrics.netProfit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(metrics.netProfit, settings.currency)}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {metrics.netProfit >= 0 ? 'Surplus balance' : 'Operating deficit'}
            </p>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Profit Margin
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                metrics.profitMargin >= 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              {formatPercentage(metrics.profitMargin)}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {metrics.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {(metrics.totalIncome > 0 ? (metrics.netProfit / metrics.totalIncome) * 100 : 0) >= 20
                ? 'Healthy cash retention'
                : 'Tight operating margins'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Streams
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {metrics.totalStreamsCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <FolderTree className="w-3.5 h-3.5" /> Categories
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {metrics.totalCategoriesCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" /> Clients
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {metrics.totalClientsCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Active Inc.
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.selectedIncomeEntriesCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-rose-600" /> Active Exp.
          </div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {metrics.selectedExpenseEntriesCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" /> Top Performer
          </div>
          <div className="text-xs font-semibold truncate text-neutral-900 dark:text-white mt-1.5" title={metrics.highestEarningStream?.name || 'N/A'}>
            {metrics.highestEarningStream?.name || 'None'}
          </div>
        </div>
      </div>

      {/* Highest Stream & Category Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Highest Earning Stream
            </span>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
              {metrics.highestEarningStream?.name || 'No active income streams'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.highestEarningStream?.amount || 0, settings.currency)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Highest Spending Category
            </span>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
              {metrics.highestSpendingCategory?.name || 'No active expense categories'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.highestSpendingCategory?.amount || 0, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Income Distribution Pie Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" /> Income Distribution
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Breakdown by active income streams
              </p>
            </div>
          </div>

          {incomePieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400">
              No selected income entries for this date range.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {incomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Expense Distribution Pie Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-rose-600" /> Expense Distribution
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Breakdown by active expense categories
              </p>
            </div>
          </div>

          {expensePieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400">
              No selected expense entries for this date range.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Income vs Expenses Bar Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" /> Income vs Expenses
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Direct balance comparison of current active items
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monthly Trend Line Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <LineIcon className="w-4 h-4 text-emerald-600" /> Monthly Trend
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Income and expense history across logged months
              </p>
            </div>
          </div>

          {monthlyTrendData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-neutral-400">
              No historical data recorded yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
