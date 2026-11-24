import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStreamTotal,
  calculateCategoryTotal,
  calculateFinancialMetrics,
  formatCurrency,
  formatPercentage,
  isDateInFilter,
  exportToCSV,
} from './finance';
import { IncomeStream, IncomeEntry, ExpenseCategory, ExpenseEntry, DateFilter } from '../types/finance';

test('calculateStreamTotal only sums checked entries for the matching stream', () => {
  const entries: IncomeEntry[] = [
    { id: '1', streamId: 's1', clientName: 'Client A', amount: 5000, date: '2026-11-01', isChecked: true, createdAt: '' },
    { id: '2', streamId: 's1', clientName: 'Client B', amount: 8000, date: '2026-11-02', isChecked: true, createdAt: '' },
    { id: '3', streamId: 's1', clientName: 'Client C', amount: 3000, date: '2026-11-03', isChecked: false, createdAt: '' },
    { id: '4', streamId: 's2', clientName: 'Client D', amount: 10000, date: '2026-11-04', isChecked: true, createdAt: '' },
  ];

  // s1 has 5000 + 8000 checked = 13000 (3000 unchecked is excluded)
  assert.equal(calculateStreamTotal('s1', entries), 13000);
  assert.equal(calculateStreamTotal('s2', entries), 10000);
  assert.equal(calculateStreamTotal('s3', entries), 0);
});

test('calculateCategoryTotal only sums checked expenses', () => {
  const expenses: ExpenseEntry[] = [
    { id: '1', categoryId: 'c1', name: 'Lunch', amount: 150, date: '2026-11-01', isChecked: true, createdAt: '' },
    { id: '2', categoryId: 'c1', name: 'Dinner', amount: 200, date: '2026-11-02', isChecked: true, createdAt: '' },
    { id: '3', categoryId: 'c1', name: 'Coffee', amount: 100, date: '2026-11-03', isChecked: false, createdAt: '' },
  ];

  assert.equal(calculateCategoryTotal('c1', expenses), 350);
});

test('calculateFinancialMetrics computes net profit, profit margin and respects unchecked entries', () => {
  const streams: IncomeStream[] = [
    { id: 's1', name: 'Freelancing', createdAt: '' },
    { id: 's2', name: 'SaaS', createdAt: '' },
  ];

  const income: IncomeEntry[] = [
    { id: '1', streamId: 's1', clientName: 'Acme', amount: 10000, date: '2026-11-01', isChecked: true, createdAt: '' },
    { id: '2', streamId: 's2', clientName: 'Stripe', amount: 5000, date: '2026-11-02', isChecked: true, createdAt: '' },
    { id: '3', streamId: 's2', clientName: 'Pending', amount: 2000, date: '2026-11-03', isChecked: false, createdAt: '' },
  ];

  const categories: ExpenseCategory[] = [
    { id: 'c1', name: 'Server', createdAt: '' },
  ];

  const expenses: ExpenseEntry[] = [
    { id: '1', categoryId: 'c1', name: 'AWS', amount: 3000, date: '2026-11-05', isChecked: true, createdAt: '' },
    { id: '2', categoryId: 'c1', name: 'Unused tool', amount: 1000, date: '2026-11-06', isChecked: false, createdAt: '' },
  ];

  const metrics = calculateFinancialMetrics(streams, income, categories, expenses);

  assert.equal(metrics.totalIncome, 15000);
  assert.equal(metrics.totalExpenses, 3000);
  assert.equal(metrics.netProfit, 12000); // 15000 - 3000
  assert.equal(metrics.profitMargin, 80); // (12000 / 15000) * 100 = 80%
  assert.equal(metrics.selectedIncomeEntriesCount, 2);
  assert.equal(metrics.selectedExpenseEntriesCount, 1);
  assert.deepEqual(metrics.highestEarningStream, { name: 'Freelancing', amount: 10000 });
  assert.deepEqual(metrics.highestSpendingCategory, { name: 'Server', amount: 3000 });
});

test('calculateFinancialMetrics handles zero income gracefully without division errors', () => {
  const streams: IncomeStream[] = [];
  const income: IncomeEntry[] = [];
  const categories: ExpenseCategory[] = [{ id: 'c1', name: 'Rent', createdAt: '' }];
  const expenses: ExpenseEntry[] = [
    { id: '1', categoryId: 'c1', name: 'Office', amount: 2000, date: '2026-11-01', isChecked: true, createdAt: '' },
  ];

  const metrics = calculateFinancialMetrics(streams, income, categories, expenses);
  assert.equal(metrics.totalIncome, 0);
  assert.equal(metrics.totalExpenses, 2000);
  assert.equal(metrics.netProfit, -2000);
  assert.equal(metrics.profitMargin, 0);
  assert.equal(Number.isNaN(metrics.profitMargin), false);
  assert.equal(Number.isFinite(metrics.profitMargin), true);
});

test('isDateInFilter correctly filters months and custom date ranges', () => {
  const monthFilter: DateFilter = { type: 'current_month', selectedMonth: '2026-11' };
  assert.equal(isDateInFilter('2026-11-05', monthFilter), true);
  assert.equal(isDateInFilter('2026-10-25', monthFilter), false);

  const customFilter: DateFilter = {
    type: 'custom',
    selectedMonth: '2026-11',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
  };
  assert.equal(isDateInFilter('2026-11-15', customFilter), true);
  assert.equal(isDateInFilter('2026-11-09', customFilter), false);
  assert.equal(isDateInFilter('2026-11-21', customFilter), false);

  const allFilter: DateFilter = { type: 'all', selectedMonth: '2026-11' };
  assert.equal(isDateInFilter('2025-01-01', allFilter), true);
});

test('formatCurrency and formatPercentage render properly', () => {
  assert.ok(formatCurrency(5000, 'INR').includes('5,000'));
  assert.ok(formatCurrency(1500, 'USD').includes('1,500'));
  assert.equal(formatPercentage(45.67), '+45.7%');
  assert.equal(formatPercentage(-12.4), '-12.4%');
  assert.equal(formatPercentage(NaN), '0.0%');
});

test('exportToCSV formats valid CSV rows', () => {
  const streams: IncomeStream[] = [{ id: 's1', name: 'Freelancing', createdAt: '' }];
  const income: IncomeEntry[] = [
    { id: '1', streamId: 's1', clientName: 'Client X', amount: 5000, date: '2026-11-01', isChecked: true, notes: 'Paid', createdAt: '' },
  ];
  const categories: ExpenseCategory[] = [{ id: 'c1', name: 'Tools', createdAt: '' }];
  const expenses: ExpenseEntry[] = [
    { id: '1', categoryId: 'c1', name: 'Vite Pro', amount: 120, date: '2026-11-02', isChecked: true, notes: 'Subscription', createdAt: '' },
  ];

  const csv = exportToCSV(streams, income, categories, expenses, 'INR');
  assert.ok(csv.includes('Type,Stream / Category'));
  assert.ok(csv.includes('Freelancing'));
  assert.ok(csv.includes('Client X'));
  assert.ok(csv.includes('Tools'));
  assert.ok(csv.includes('Vite Pro'));
});
