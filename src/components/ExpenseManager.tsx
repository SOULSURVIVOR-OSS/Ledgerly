import React, { useState, useMemo } from 'react';
import {
  Plus,
  TrendingDown,
  Search,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  calculateCategoryTotal,
  formatCurrency,
  isDateInFilter,
} from '../utils/finance';
import { ExpenseCategory, ExpenseEntry } from '../types/finance';

export const ExpenseManager: React.FC = () => {
  const {
    categories,
    expenseEntries,
    addCategory,
    updateCategory,
    deleteCategory,
    addExpenseEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
    toggleExpenseEntry,
    toggleAllExpenseInCategory,
    settings,
    dateFilter,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryColorInput, setCategoryColorInput] = useState('#ef4444');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [expenseFormCategoryId, setExpenseFormCategoryId] = useState('');
  const [expenseFormName, setExpenseFormName] = useState('');
  const [expenseFormAmount, setExpenseFormAmount] = useState('');
  const [expenseFormDate, setExpenseFormDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [expenseFormChecked, setExpenseFormChecked] = useState(true);
  const [expenseFormNotes, setExpenseFormNotes] = useState('');

  // Delete confirmations
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Filter entries according to dateFilter
  const filteredEntries = useMemo(() => {
    return expenseEntries.filter((entry) => isDateInFilter(entry.date, dateFilter));
  }, [expenseEntries, dateFilter]);

  // Overall selected expense total
  const overallSelectedExpenses = useMemo(() => {
    return filteredEntries
      .filter((e) => e.isChecked)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredEntries]);

  // Handle open Add Category
  const handleOpenAddCategory = () => {
    setCategoryNameInput('');
    setCategoryColorInput('#ef4444');
    setIsAddCategoryOpen(true);
  };

  // Handle Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryNameInput, categoryColorInput);
      setEditingCategory(null);
    } else {
      addCategory(categoryNameInput, categoryColorInput);
      setIsAddCategoryOpen(false);
    }
    setCategoryNameInput('');
  };

  // Handle open Add Expense
  const handleOpenAddExpense = (catId?: string) => {
    const defaultCatId = catId || (categories.length > 0 ? categories[0].id : '');
    setExpenseFormCategoryId(defaultCatId);
    setExpenseFormName('');
    setExpenseFormAmount('');
    setExpenseFormDate(new Date().toISOString().split('T')[0]);
    setExpenseFormChecked(true);
    setExpenseFormNotes('');
    setEditingExpense(null);
    setIsAddExpenseOpen(true);
  };

  // Handle open Edit Expense
  const handleOpenEditExpense = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
    setExpenseFormCategoryId(expense.categoryId);
    setExpenseFormName(expense.name);
    setExpenseFormAmount(expense.amount.toString());
    setExpenseFormDate(expense.date);
    setExpenseFormChecked(expense.isChecked);
    setExpenseFormNotes(expense.notes || '');
    setIsAddExpenseOpen(true);
  };

  // Handle Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseFormAmount);
    if (!expenseFormName.trim() || isNaN(amountNum) || amountNum < 0 || !expenseFormCategoryId) {
      return;
    }

    if (editingExpense) {
      updateExpenseEntry(editingExpense.id, {
        categoryId: expenseFormCategoryId,
        name: expenseFormName.trim(),
        amount: amountNum,
        date: expenseFormDate,
        isChecked: expenseFormChecked,
        notes: expenseFormNotes.trim(),
      });
    } else {
      addExpenseEntry({
        categoryId: expenseFormCategoryId,
        name: expenseFormName.trim(),
        amount: amountNum,
        date: expenseFormDate,
        isChecked: expenseFormChecked,
        notes: expenseFormNotes.trim(),
      });
    }
    setIsAddExpenseOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-4 h-4" />
            <span>Active Expense Control</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {formatCurrency(overallSelectedExpenses, settings.currency)}
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              from selected expenses
            </span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Independent counter: toggle expenses to forecast budget scenarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddCategory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => handleOpenAddExpense()}
            disabled={categories.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense Entry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search category or expense item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <span>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
          <span>•</span>
          <span>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'expense item' : 'expense items'}
          </span>
        </div>
      </div>

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <TrendingDown className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No Expense Categories Yet
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Create an expense category (e.g. Food, Transportation, Housing, SaaS, Utilities) to begin tracking your expenses.
          </p>
          <button
            onClick={handleOpenAddCategory}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Expense Category</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const catExpenses = filteredEntries.filter((e) => e.categoryId === category.id);
            const matchingExpenses = searchQuery.trim()
              ? catExpenses.filter(
                  (c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : catExpenses;

            if (searchQuery.trim() && matchingExpenses.length === 0 && !category.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return null;
            }

            const categoryTotal = calculateCategoryTotal(category.id, filteredEntries);
            const allChecked = catExpenses.length > 0 && catExpenses.every((c) => c.isChecked);

            return (
              <div
                key={category.id}
                className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/20 gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: category.color || '#ef4444' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          {category.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                          {catExpenses.length} {catExpenses.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Category Total:{' '}
                        <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                          {formatCurrency(categoryTotal, settings.currency)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Category Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Toggle All Checkbox */}
                    {catExpenses.length > 0 && (
                      <button
                        onClick={() => toggleAllExpenseInCategory(category.id, !allChecked)}
                        title={allChecked ? 'Deselect all in category' : 'Select all in category'}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {allChecked ? (
                          <CheckSquare className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                        <span>{allChecked ? 'Deselect All' : 'Select All'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenAddExpense(category.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Expense</span>
                    </button>

                    {/* Rename Category */}
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryNameInput(category.name);
                        setCategoryColorInput(category.color || '#ef4444');
                      }}
                      title="Rename category"
                      aria-label={`Rename category ${category.name}`}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Category */}
                    <button
                      onClick={() => setDeletingCategoryId(category.id)}
                      title="Delete category"
                      aria-label={`Delete category ${category.name}`}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expenses Table / List */}
                {catExpenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No expense entries under this category yet.{' '}
                    <button
                      onClick={() => handleOpenAddExpense(category.id)}
                      className="text-rose-600 dark:text-rose-400 font-semibold underline hover:no-underline ml-1"
                    >
                      Add expense now
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                    {matchingExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className={`flex items-center justify-between p-3.5 sm:px-5 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                          !expense.isChecked ? 'opacity-60 bg-neutral-50/30 dark:bg-neutral-900/30' : ''
                        }`}
                      >
                        {/* Checkbox & Item Info */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={expense.isChecked}
                              onChange={() => toggleExpenseEntry(expense.id)}
                              aria-label={`Include ${expense.name} in expense calculation`}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 border-neutral-300 dark:border-neutral-600 text-rose-600 accent-rose-600 dark:accent-rose-500 cursor-pointer transition-transform active:scale-95"
                            />
                          </label>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  expense.isChecked
                                    ? 'text-neutral-900 dark:text-white'
                                    : 'text-neutral-500 dark:text-neutral-400 line-through'
                                }`}
                              >
                                {expense.name}
                              </span>
                              {!expense.isChecked && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                                  Excluded
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {expense.date}
                              </span>
                              {expense.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{expense.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold font-mono ${
                                expense.isChecked
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-neutral-400 dark:text-neutral-500'
                              }`}
                            >
                              {formatCurrency(expense.amount, settings.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditExpense(expense)}
                              title="Edit expense entry"
                              aria-label={`Edit ${expense.name}`}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingExpenseId(expense.id)}
                              title="Delete expense entry"
                              aria-label={`Delete ${expense.name}`}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Category */}
      {(isAddCategoryOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingCategory ? 'Rename Expense Category' : 'New Expense Category'}
              </h3>
              <button
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Food & Groceries, Transport, Subscriptions, Office"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#6366f1', '#a855f7'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategoryColorInput(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          categoryColorInput === c ? 'scale-115 ring-2 ring-offset-2 ring-rose-500' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Expense Entry */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingExpense ? 'Edit Expense Entry' : 'Add Expense Entry'}
              </h3>
              <button
                onClick={() => {
                  setIsAddExpenseOpen(false);
                  setEditingExpense(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expense Category *
                </label>
                <select
                  required
                  value={expenseFormCategoryId}
                  onChange={(e) => setExpenseFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expense Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Hosting, Team Dinner, Office Fiber"
                  value={expenseFormName}
                  onChange={(e) => setExpenseFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    value={expenseFormAmount}
                    onChange={(e) => setExpenseFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseFormDate}
                    onChange={(e) => setExpenseFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly bill, Receipt attached"
                  value={expenseFormNotes}
                  onChange={(e) => setExpenseFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Checkbox inclusion toggle */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expenseFormChecked}
                    onChange={(e) => setExpenseFormChecked(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Include in active expense calculation
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Uncheck to temporarily exclude from budget calculation.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExpenseOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {editingExpense ? 'Save Expense Entry' : 'Add Expense Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deletingCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Delete Expense Category?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              This will permanently delete this category and all expenses logged under it.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeletingCategoryId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCategory(deletingCategoryId);
                  setDeletingCategoryId(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation */}
      {deletingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Delete Expense Entry?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Are you sure you want to delete this expense from records?
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeletingExpenseId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteExpenseEntry(deletingExpenseId);
                  setDeletingExpenseId(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
