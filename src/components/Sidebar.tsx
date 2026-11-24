import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Cloud,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/finance';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { activeTab, setActiveTab, metrics, settings, user } = useFinance();

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'income' as const,
      label: 'Income Manager',
      icon: TrendingUp,
      badge: `${metrics.selectedIncomeEntriesCount}`,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'expenses' as const,
      label: 'Expense Manager',
      icon: TrendingDown,
      badge: `${metrics.selectedExpenseEntriesCount}`,
      color: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'dashboard' as const,
      label: 'Analytics & Charts',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold shadow-xs shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                  Ledgerly
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    Pro
                  </span>
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                  Smart Budget Engine
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? 'text-white dark:text-neutral-900'
                      : item.color || 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick summary mini card in sidebar */}
        {!collapsed && (
          <div className="p-3 m-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Active Net
              </span>
              <span
                className={`font-semibold ${
                  metrics.netProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {metrics.profitMargin.toFixed(1)}%
              </span>
            </div>
            <div
              className={`text-base font-bold font-mono tracking-tight ${
                metrics.netProfit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(metrics.netProfit, settings.currency)}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
              {metrics.selectedIncomeEntriesCount} income • {metrics.selectedExpenseEntriesCount} expenses
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                {user ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span className="text-emerald-700 dark:text-emerald-400">Cloud Synced</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Local Mode</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-neutral-400">
                {user ? 'Firestore Live' : 'Guest'}
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              {user ? (
                <Cloud className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
