import React, { useState } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  formatMonthDisplay,
  getCurrentMonthStr,
  getPreviousMonthStr,
} from '../utils/finance';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    activeTab,
    dateFilter,
    setDateFilter,
    goToNextMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    settings,
    updateSettings,
    metrics,
    user,
    isSigningIn,
    signInWithGoogle,
    signOut,
  } = useFinance();

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const pageTitles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Financial Overview',
      subtitle: 'Real-time cash flow & scenario checkbox controls',
    },
    income: {
      title: 'Income Manager',
      subtitle: 'Organize streams, clients & toggle active revenue',
    },
    expenses: {
      title: 'Expense Manager',
      subtitle: 'Group budget categories & toggle active costs',
    },
    dashboard: {
      title: 'Analytics Dashboard',
      subtitle: 'Distribution charts, profit margins & cashflow trends',
    },
    settings: {
      title: 'Preferences & Settings',
      subtitle: 'Currency configuration, data export & local backups',
    },
  };

  const currentInfo = pageTitles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Mobile trigger & Page titles */}
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <button
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date navigation & Live Financial Pills & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month Navigator Control */}
          <div className="relative inline-flex items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-xl p-1 border border-neutral-200/70 dark:border-neutral-700/60 shadow-2xs">
            <button
              onClick={goToPreviousMonth}
              aria-label="Previous Month"
              title="Previous Month"
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-2xs transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-2.5 py-1 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>
                {dateFilter.type === 'all'
                  ? 'All Time'
                  : dateFilter.type === 'custom'
                  ? 'Custom Range'
                  : formatMonthDisplay(dateFilter.selectedMonth)}
              </span>
            </button>

            <button
              onClick={goToNextMonth}
              aria-label="Next Month"
              title="Next Month"
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-2xs transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick dropdown filter */}
            {showFilterDropdown && (
              <div className="absolute top-full mt-2 right-0 w-60 z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Time Period
                </div>
                <button
                  onClick={() => {
                    goToCurrentMonth();
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dateFilter.type === 'current_month' &&
                    dateFilter.selectedMonth === getCurrentMonthStr()
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Current Month ({formatMonthDisplay(getCurrentMonthStr())})
                </button>

                <button
                  onClick={() => {
                    const prev = getPreviousMonthStr(getCurrentMonthStr());
                    setDateFilter({
                      type: 'previous_month',
                      selectedMonth: prev,
                    });
                    setShowFilterDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  Previous Month ({formatMonthDisplay(getPreviousMonthStr(getCurrentMonthStr()))})
                </button>

                <button
                  onClick={() => {
                    setDateFilter((prev) => ({
                      ...prev,
                      type: 'all',
                    }));
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dateFilter.type === 'all'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  All Historical Records
                </button>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-1">
                  <div className="text-[11px] text-neutral-400 px-2 py-1 flex items-center justify-between">
                    <span>Jump to Month:</span>
                  </div>
                  <input
                    type="month"
                    value={dateFilter.selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateFilter({
                          type: 'current_month',
                          selectedMonth: e.target.value,
                        });
                        setShowFilterDropdown(false);
                      }
                    }}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Net:</span>
            <span
              className={`font-bold font-mono ${
                metrics.netProfit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(metrics.netProfit, settings.currency)}
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            aria-label={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Authentication & Cloud Sync */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-600 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[110px]">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    ● Cloud Synced
                  </span>
                </div>
              </div>

              <button
                onClick={signOut}
                title="Sign out of Ledgerly"
                className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-2xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Signing in...' : 'Sign In with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
