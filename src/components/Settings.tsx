import React, { useState } from 'react';
import {
  Download,
  Trash2,
  RefreshCw,
  Moon,
  Sun,
  Coins,
  ShieldCheck,
  Target,
  Database,
  Check,
  AlertTriangle,
  Cloud,
  UserCheck,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, exportToCSV, formatCurrency } from '../utils/finance';
import { CurrencyCode } from '../types/finance';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    streams,
    incomeEntries,
    categories,
    expenseEntries,
    resetAllData,
    restoreSampleData,
    user,
    signInWithGoogle,
    signOut,
    syncLocalToCloud,
    isCloudSynced,
  } = useFinance();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = async () => {
    await syncLocalToCloud();
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  // Handle CSV Download
  const handleExportCSV = () => {
    const csvContent = exportToCSV(
      streams,
      incomeEntries,
      categories,
      expenseEntries,
      settings.currency
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledgerly-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleRestoreSamples = () => {
    restoreSampleData();
    setRestoreSuccess(true);
    setTimeout(() => setRestoreSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Account & Cloud Database Sync */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Account & Cloud Storage
              </h3>
              <p className="text-xs text-neutral-400">
                Persistent storage backed by Google Cloud Firestore database.
              </p>
            </div>
          </div>

          {user && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected & Synced</span>
            </span>
          )}
        </div>

        <div className="pt-5">
          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-700/60">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-12 h-12 rounded-full border border-neutral-300 dark:border-neutral-600 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {user.displayName || 'Account Holder'}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                  <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    User UID: {user.uid}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  onClick={handleManualSync}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                >
                  {syncSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Backup Updated!</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sync to Cloud Now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-200/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Save your financial records permanently
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-lg">
                  You are currently in guest / local storage mode. Sign in with your Google account to automatically store your income streams, clients, and expenses in your secure cloud database.
                </p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs shrink-0 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Currency & Localization */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <Coins className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Primary Currency
            </h3>
            <p className="text-xs text-neutral-400">
              Select your reporting currency. Formats numbers using regional standards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-5">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const config = CURRENCIES[code];
            const isSelected = settings.currency === code;
            return (
              <button
                key={code}
                onClick={() => updateSettings({ currency: code })}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span className="font-mono text-base">{config.symbol}</span>
                    <span>{config.code}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {config.label.split(' - ')[1]}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Theme */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.darkMode ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Appearance & Theme
              </h3>
              <p className="text-xs text-neutral-400">
                Switch between clean high-contrast light mode and refined dark mode.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => updateSettings({ darkMode: false })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !settings.darkMode
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => updateSettings({ darkMode: true })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                settings.darkMode
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Goal Planning */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <Target className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Monthly Expense Target
            </h3>
            <p className="text-xs text-neutral-400">
              Set an intended monthly expense ceiling to monitor budget compliance.
            </p>
          </div>
        </div>

        <div className="pt-4 max-w-sm">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Target Maximum Budget ({settings.currency})
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1000"
              value={settings.monthlyBudgetGoal || ''}
              onChange={(e) =>
                updateSettings({
                  monthlyBudgetGoal: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              placeholder="e.g. 50000"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Export & Data Management */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Data Management & Persistence
            </h3>
            <p className="text-xs text-neutral-400">
              Ledgerly saves all streams, clients, expenses, and checkbox states locally in your browser.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Export to CSV */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export to CSV</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Download complete ledger records with dates, status, notes, and values.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export CSV
                </>
              )}
            </button>
          </div>

          {/* Restore Sample Data */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Restore Sample Data</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Reset to default realistic freelancer / consultant financial scenario.
              </p>
            </div>
            <button
              onClick={handleRestoreSamples}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              {restoreSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Restored!
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Restore Demo Data
                </>
              )}
            </button>
          </div>

          {/* Clear All Data */}
          <div className="p-4 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clear All Data</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Wipe all streams, categories, clients and expenses from browser storage.
              </p>
            </div>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All Records
            </button>
          </div>
        </div>

        {/* Supabase Ready Notice */}
        <div className="mt-6 p-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Supabase & Cloud Sync Architecture Ready
            </span>
            <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">
              The internal data model is architected with UUIDs, timestamps, foreign keys (streamId, categoryId), and state flags so it can be seamlessly attached to Supabase PostgreSQL tables and row-level security policies whenever you need multi-device cloud synchronization.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Clear All Financial Data?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              This will erase all your custom income streams, client entries, expense categories, and logged expenses. You will start with a completely empty ledger.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
