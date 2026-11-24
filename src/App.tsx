/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { IncomeManager } from './components/IncomeManager';
import { ExpenseManager } from './components/ExpenseManager';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ledgerly ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Something went wrong</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              Reload Ledgerly
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const { activeTab, authError, clearAuthError } = useFinance();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />

        {authError && (
          <div
            role="alert"
            className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-3 text-xs shadow-2xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Google Sign-In / Cloud Sync Notice</p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">
                  {authError}
                </p>
              </div>
            </div>
            <button
              onClick={clearAuthError}
              aria-label="Dismiss authentication notice"
              className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'income' && <IncomeManager />}
          {activeTab === 'expenses' && <ExpenseManager />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <MainLayout />
      </FinanceProvider>
    </ErrorBoundary>
  );
}
