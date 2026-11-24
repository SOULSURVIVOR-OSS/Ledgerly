import {
  CurrencyCode,
  CurrencyConfig,
  DateFilter,
  ExpenseCategory,
  ExpenseEntry,
  FinancialMetrics,
  IncomeEntry,
  IncomeStream,
} from '../types/finance';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', label: 'CAD ($) - Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'AUD ($) - Australian Dollar', locale: 'en-AU' },
};

/**
 * Formats a number into localized currency format
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const isNegative = amount < 0;
  const absoluteValue = Math.abs(amount);

  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: config.code === 'JPY' ? 0 : 2,
      minimumFractionDigits: config.code === 'JPY' ? 0 : (absoluteValue % 1 === 0 ? 0 : 2),
    }).format(absoluteValue);

    return isNegative ? `-${formatted}` : formatted;
  } catch {
    const sign = isNegative ? '-' : '';
    return `${sign}${config.symbol}${absoluteValue.toLocaleString()}`;
  }
}

/**
 * Formats a percentage
 */
export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Helper to get current YYYY-MM
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Helper to get previous YYYY-MM
 */
export function getPreviousMonthStr(currentStr: string = getCurrentMonthStr()): string {
  const [yearStr, monthStr] = currentStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Format a YYYY-MM into a friendly month-year title e.g. "November 2026"
 */
export function formatMonthDisplay(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthNumStr, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

/**
 * Check if a date string (YYYY-MM-DD) matches the active DateFilter
 */
export function isDateInFilter(dateStr: string, filter: DateFilter): boolean {
  if (!dateStr) return false;
  if (filter.type === 'all') return true;

  if (filter.type === 'current_month' || filter.type === 'previous_month') {
    return dateStr.startsWith(filter.selectedMonth);
  }

  if (filter.type === 'custom') {
    if (filter.startDate && dateStr < filter.startDate) return false;
    if (filter.endDate && dateStr > filter.endDate) return false;
    return true;
  }

  return true;
}

/**
 * Calculate total for an individual income stream
 * ONLY sums entries that are isChecked === true and match the filter
 */
export function calculateStreamTotal(
  streamId: string,
  entries: IncomeEntry[],
  filter?: DateFilter
): number {
  return entries
    .filter((e) => e.streamId === streamId && e.isChecked && (!filter || isDateInFilter(e.date, filter)))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

/**
 * Calculate total for an individual expense category
 * ONLY sums entries that are isChecked === true and match the filter
 */
export function calculateCategoryTotal(
  categoryId: string,
  entries: ExpenseEntry[],
  filter?: DateFilter
): number {
  return entries
    .filter((e) => e.categoryId === categoryId && e.isChecked && (!filter || isDateInFilter(e.date, filter)))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

/**
 * Calculates comprehensive financial metrics based on selected entries
 */
export function calculateFinancialMetrics(
  streams: IncomeStream[],
  incomeEntries: IncomeEntry[],
  categories: ExpenseCategory[],
  expenseEntries: ExpenseEntry[],
  filter?: DateFilter
): FinancialMetrics {
  // Filter entries that match date filter
  const filteredIncome = filter
    ? incomeEntries.filter((e) => isDateInFilter(e.date, filter))
    : incomeEntries;

  const filteredExpenses = filter
    ? expenseEntries.filter((e) => isDateInFilter(e.date, filter))
    : expenseEntries;

  // Selected entries
  const selectedIncomeEntries = filteredIncome.filter((e) => e.isChecked);
  const selectedExpenseEntries = filteredExpenses.filter((e) => e.isChecked);

  // Totals
  const totalIncome = selectedIncomeEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = selectedExpenseEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Net Profit = Total Income - Total Expenses
  const netProfit = totalIncome - totalExpenses;

  // Profit Margin = (Net Profit / Total Income) * 100
  // Safe handling of zero income to avoid NaN or Infinity
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Counts
  const totalStreamsCount = streams.length;
  const totalCategoriesCount = categories.length;
  const totalClientsCount = filteredIncome.length;
  const selectedIncomeEntriesCount = selectedIncomeEntries.length;
  const selectedExpenseEntriesCount = selectedExpenseEntries.length;

  // Highest earning stream
  let highestEarningStream: { name: string; amount: number } | null = null;
  let maxIncome = 0;
  for (const stream of streams) {
    const streamAmount = calculateStreamTotal(stream.id, filteredIncome);
    if (streamAmount > maxIncome) {
      maxIncome = streamAmount;
      highestEarningStream = { name: stream.name, amount: streamAmount };
    }
  }

  // Highest spending category
  let highestSpendingCategory: { name: string; amount: number } | null = null;
  let maxExpense = 0;
  for (const cat of categories) {
    const catAmount = calculateCategoryTotal(cat.id, filteredExpenses);
    if (catAmount > maxExpense) {
      maxExpense = catAmount;
      highestSpendingCategory = { name: cat.name, amount: catAmount };
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    totalStreamsCount,
    totalCategoriesCount,
    totalClientsCount,
    selectedIncomeEntriesCount,
    selectedExpenseEntriesCount,
    highestEarningStream,
    highestSpendingCategory,
  };
}

/**
 * Generate CSV string for export
 */
export function exportToCSV(
  streams: IncomeStream[],
  incomeEntries: IncomeEntry[],
  categories: ExpenseCategory[],
  expenseEntries: ExpenseEntry[],
  currency: CurrencyCode
): string {
  const streamMap = new Map(streams.map((s) => [s.id, s.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ['Type', 'Stream / Category', 'Item / Client Name', 'Amount', 'Currency', 'Date', 'Included (Checked)', 'Notes'];
  const rows: string[][] = [headers];

  // Income entries
  for (const item of incomeEntries) {
    rows.push([
      'Income',
      `"${(streamMap.get(item.streamId) || 'Unknown').replace(/"/g, '""')}"`,
      `"${item.clientName.replace(/"/g, '""')}"`,
      item.amount.toString(),
      currency,
      item.date,
      item.isChecked ? 'YES' : 'NO',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);
  }

  // Expense entries
  for (const item of expenseEntries) {
    rows.push([
      'Expense',
      `"${(categoryMap.get(item.categoryId) || 'Unknown').replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.amount.toString(),
      currency,
      item.date,
      item.isChecked ? 'YES' : 'NO',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);
  }

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Generate realistic sample data for initial experience
 */
export function getInitialSampleData(currentMonth: string = getCurrentMonthStr()): {
  streams: IncomeStream[];
  incomeEntries: IncomeEntry[];
  categories: ExpenseCategory[];
  expenseEntries: ExpenseEntry[];
} {
  const streams: IncomeStream[] = [
    { id: 'str-1', name: 'Freelancing & Design', color: '#10b981', createdAt: new Date().toISOString() },
    { id: 'str-2', name: 'Software Consulting', color: '#059669', createdAt: new Date().toISOString() },
    { id: 'str-3', name: 'Digital Products & SaaS', color: '#34d399', createdAt: new Date().toISOString() },
    { id: 'str-4', name: 'Content & Sponsorships', color: '#6ee7b7', createdAt: new Date().toISOString() },
  ];

  const incomeEntries: IncomeEntry[] = [
    {
      id: 'inc-1',
      streamId: 'str-1',
      clientName: 'Apex Studio (UI Redesign)',
      amount: 45000,
      date: `${currentMonth}-04`,
      isChecked: true,
      notes: 'Milestone 2 payment received',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-2',
      streamId: 'str-1',
      clientName: 'Nexus Corp (Brand Guide)',
      amount: 28000,
      date: `${currentMonth}-08`,
      isChecked: true,
      notes: 'Completed brand visual system',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-3',
      streamId: 'str-1',
      clientName: 'Vanguard Ltd (Pending Approval)',
      amount: 15000,
      date: `${currentMonth}-11`,
      isChecked: false,
      notes: 'Awaiting client sign-off before invoice',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-4',
      streamId: 'str-2',
      clientName: 'Fintech Solutions (Arch Review)',
      amount: 60000,
      date: `${currentMonth}-02`,
      isChecked: true,
      notes: 'Monthly retainer contract',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-5',
      streamId: 'str-2',
      clientName: 'HealthTech Hub (API Integration)',
      amount: 35000,
      date: `${currentMonth}-10`,
      isChecked: true,
      notes: 'Payment transferred via NEFT',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-6',
      streamId: 'str-3',
      clientName: 'Figma UI Kit Sales (Gumroad)',
      amount: 14200,
      date: `${currentMonth}-06`,
      isChecked: true,
      notes: '38 bundle licenses sold',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-7',
      streamId: 'str-3',
      clientName: 'Micro-SaaS Monthly Subscriptions',
      amount: 19800,
      date: `${currentMonth}-09`,
      isChecked: true,
      notes: 'Stripe recurring payout',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-8',
      streamId: 'str-4',
      clientName: 'Tech Newsletter Sponsor (Acme)',
      amount: 12000,
      date: `${currentMonth}-05`,
      isChecked: true,
      notes: 'Primary edition placement',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc-9',
      streamId: 'str-4',
      clientName: 'Podcast Pre-roll Sponsor',
      amount: 8000,
      date: `${currentMonth}-12`,
      isChecked: false,
      notes: 'Contract under legal review',
      createdAt: new Date().toISOString(),
    },
  ];

  const categories: ExpenseCategory[] = [
    { id: 'cat-1', name: 'Software & Infrastructure', color: '#ef4444', createdAt: new Date().toISOString() },
    { id: 'cat-2', name: 'Office & Workspace', color: '#f87171', createdAt: new Date().toISOString() },
    { id: 'cat-3', name: 'Marketing & Subscriptions', color: '#dc2626', createdAt: new Date().toISOString() },
    { id: 'cat-4', name: 'Travel & Client Meetings', color: '#b91c1c', createdAt: new Date().toISOString() },
  ];

  const expenseEntries: ExpenseEntry[] = [
    {
      id: 'exp-1',
      categoryId: 'cat-1',
      name: 'AWS & Vercel Hosting',
      amount: 4800,
      date: `${currentMonth}-01`,
      isChecked: true,
      notes: 'Production cluster instances',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      categoryId: 'cat-1',
      name: 'GitHub Enterprise & Copilot',
      amount: 2200,
      date: `${currentMonth}-03`,
      isChecked: true,
      notes: 'Annual developer seats',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      categoryId: 'cat-1',
      name: 'Figma Organization Plan',
      amount: 3600,
      date: `${currentMonth}-04`,
      isChecked: true,
      notes: 'Design team workspace',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      categoryId: 'cat-2',
      name: 'Co-working Desk Membership',
      amount: 12000,
      date: `${currentMonth}-02`,
      isChecked: true,
      notes: 'Downtown studio hub',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-5',
      categoryId: 'cat-2',
      name: 'High-speed Fiber Internet',
      amount: 1500,
      date: `${currentMonth}-05`,
      isChecked: true,
      notes: '1 Gbps dedicated line',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-6',
      categoryId: 'cat-2',
      name: 'Ergonomic Desk Accessories',
      amount: 4500,
      date: `${currentMonth}-07`,
      isChecked: false,
      notes: 'Optional monitor riser pending decision',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-7',
      categoryId: 'cat-3',
      name: 'Google & LinkedIn Ad Spend',
      amount: 8500,
      date: `${currentMonth}-06`,
      isChecked: true,
      notes: 'Lead generation campaign',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-8',
      categoryId: 'cat-4',
      name: 'Client Lunch & Travel Cab',
      amount: 2100,
      date: `${currentMonth}-08`,
      isChecked: true,
      notes: 'Strategy dinner with Apex founders',
      createdAt: new Date().toISOString(),
    },
  ];

  return { streams, incomeEntries, categories, expenseEntries };
}
