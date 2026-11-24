import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  User as FirebaseUser,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  CurrencyCode,
  DateFilter,
  ExpenseCategory,
  ExpenseEntry,
  FinancialMetrics,
  IncomeEntry,
  IncomeStream,
  UserSettings,
} from '../types/finance';
import {
  calculateFinancialMetrics,
  getCurrentMonthStr,
  getInitialSampleData,
  getPreviousMonthStr,
} from '../utils/finance';
import {
  auth,
  db,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';

interface FinanceContextType {
  // Navigation
  activeTab: 'overview' | 'income' | 'expenses' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'overview' | 'income' | 'expenses' | 'dashboard' | 'settings') => void;

  // Auth & Cloud Sync
  user: FirebaseUser | null;
  authLoading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  isCloudSynced: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Streams & Categories
  streams: IncomeStream[];
  categories: ExpenseCategory[];
  addStream: (name: string, color?: string) => Promise<string>;
  updateStream: (id: string, name: string, color?: string) => Promise<void>;
  deleteStream: (id: string) => Promise<void>;
  addCategory: (name: string, color?: string) => Promise<string>;
  updateCategory: (id: string, name: string, color?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Entries
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  addIncomeEntry: (entry: Omit<IncomeEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateIncomeEntry: (id: string, entry: Partial<IncomeEntry>) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  toggleIncomeEntry: (id: string) => Promise<void>;
  toggleAllIncomeInStream: (streamId: string, checkAll: boolean) => Promise<void>;

  addExpenseEntry: (entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateExpenseEntry: (id: string, entry: Partial<ExpenseEntry>) => Promise<void>;
  deleteExpenseEntry: (id: string) => Promise<void>;
  toggleExpenseEntry: (id: string) => Promise<void>;
  toggleAllExpenseInCategory: (categoryId: string, checkAll: boolean) => Promise<void>;

  // Filter
  dateFilter: DateFilter;
  setDateFilter: React.Dispatch<React.SetStateAction<DateFilter>>;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToCurrentMonth: () => void;

  // Settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  // Computed metrics
  metrics: FinancialMetrics;

  // System
  resetAllData: () => Promise<void>;
  restoreSampleData: () => Promise<void>;
  syncLocalToCloud: (targetUser?: FirebaseUser | null) => Promise<void>;
}

function getFriendlyAuthError(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Google Sign-In is not authorized for "${hostname}". Add "${hostname}" in Firebase Console → Authentication → Settings → Authorized domains (Project: ${FIREBASE_PROJECT_ID}).`;
    case 'auth/popup-blocked':
      return 'The Google Sign-In popup was blocked by your browser. Please allow popups for this site and click Sign In again.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In popup was closed before completing. Click Sign In with Google to try again.';
    case 'auth/cancelled-popup-request':
      return 'A sign-in window is already in progress. Please complete or close it and try again.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is disabled in Firebase Authentication for this project.';
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return 'Firebase API key configuration is invalid. Please check your Firebase configuration.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Google Sign-In. Please check your internet connection.';
    default:
      return err?.message || 'Unable to sign in with Google. Please try again.';
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STREAMS: 'ledgerly_streams_v1',
  INCOME: 'ledgerly_income_v1',
  CATEGORIES: 'ledgerly_categories_v1',
  EXPENSES: 'ledgerly_expenses_v1',
  SETTINGS: 'ledgerly_settings_v1',
  FILTER: 'ledgerly_filter_v1',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentMonthStr = getCurrentMonthStr();

  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'dashboard' | 'settings'>('overview');

  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const clearAuthError = () => setAuthError(null);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      currency: 'INR',
      darkMode: false,
      monthlyBudgetGoal: 50000,
    };
  });

  // Date Filter
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FILTER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedMonth) return parsed;
      }
    } catch {
      // fallback
    }
    return {
      type: 'current_month',
      selectedMonth: currentMonthStr,
    };
  });

  // Streams & Categories
  const [streams, setStreams] = useState<IncomeStream[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return getInitialSampleData(currentMonthStr).streams;
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return getInitialSampleData(currentMonthStr).categories;
  });

  // Entries
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOME);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return getInitialSampleData(currentMonthStr).incomeEntries;
  });

  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return getInitialSampleData(currentMonthStr).expenseEntries;
  });

  // Keep ref to latest local data so async cloud bootstrap reads fresh state
  const latestDataRef = useRef({
    streams,
    categories,
    incomeEntries,
    expenseEntries,
    settings,
  });
  latestDataRef.current = {
    streams,
    categories,
    incomeEntries,
    expenseEntries,
    settings,
  };

  // Test Firestore connection and handle any pending OAuth redirect result on boot
  useEffect(() => {
    testFirestoreConnection();
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
        }
      })
      .catch((error: unknown) => {
        const code = (error as { code?: string })?.code;
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return;
        }
        console.warn('Google Redirect Sign-In notice:', code || error);
        setAuthError(getFriendlyAuthError(error));
      });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setAuthError(null);
      } else {
        setIsCloudSynced(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Bootstrap cloud data on sign-in, then attach real-time Firestore listeners
  useEffect(() => {
    if (!user) return;

    const userId = user.uid;
    let isCancelled = false;
    const unsubscribers: Array<() => void> = [];

    const streamsCol = collection(db, 'users', userId, 'streams');
    const categoriesCol = collection(db, 'users', userId, 'categories');
    const incomeCol = collection(db, 'users', userId, 'incomeEntries');
    const expenseCol = collection(db, 'users', userId, 'expenseEntries');
    const userDocRef = doc(db, 'users', userId);

    const bootstrapAndSubscribe = async () => {
      try {
        // 1. Ensure user profile doc exists
        const userSnap = await getDoc(userDocRef);
        if (isCancelled) return;

        if (!userSnap.exists()) {
          const curSettings = latestDataRef.current.settings;
          await setDoc(
            userDocRef,
            {
              uid: userId,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              currency: curSettings.currency,
              darkMode: curSettings.darkMode,
              monthlyBudgetGoal: curSettings.monthlyBudgetGoal || 50000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        // 2. Check if this user already has cloud collections
        const [streamsSnap, categoriesSnap, incomeSnap, expenseSnap] = await Promise.all([
          getDocs(streamsCol),
          getDocs(categoriesCol),
          getDocs(incomeCol),
          getDocs(expenseCol),
        ]);
        if (isCancelled) return;

        const hasCloudData =
          !streamsSnap.empty ||
          !categoriesSnap.empty ||
          !incomeSnap.empty ||
          !expenseSnap.empty;

        const local = latestDataRef.current;
        const hasLocalData =
          local.streams.length > 0 ||
          local.categories.length > 0 ||
          local.incomeEntries.length > 0 ||
          local.expenseEntries.length > 0;

        // Only migrate local data when the cloud account has no existing records yet
        if (!hasCloudData && hasLocalData) {
          await syncLocalToCloud(user);
          if (isCancelled) return;
        }

        // 3. Attach real-time listeners after migration check finishes
        unsubscribers.push(
          onSnapshot(
            streamsCol,
            (snapshot) => {
              const cloudStreams: IncomeStream[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<IncomeStream, 'id'>),
              }));
              setStreams(cloudStreams);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/streams`);
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            categoriesCol,
            (snapshot) => {
              const cloudCats: ExpenseCategory[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<ExpenseCategory, 'id'>),
              }));
              setCategories(cloudCats);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/categories`);
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            incomeCol,
            (snapshot) => {
              const cloudIncome: IncomeEntry[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<IncomeEntry, 'id'>),
              }));
              setIncomeEntries(cloudIncome);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/incomeEntries`);
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            expenseCol,
            (snapshot) => {
              const cloudExpenses: ExpenseEntry[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<ExpenseEntry, 'id'>),
              }));
              setExpenseEntries(cloudExpenses);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/expenseEntries`);
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.currency || data.monthlyBudgetGoal !== undefined || data.darkMode !== undefined) {
                  setSettings((prev) => ({
                    ...prev,
                    currency: data.currency || prev.currency,
                    darkMode: data.darkMode ?? prev.darkMode,
                    monthlyBudgetGoal: data.monthlyBudgetGoal ?? prev.monthlyBudgetGoal,
                  }));
                }
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${userId}`);
            }
          )
        );

        setIsCloudSynced(true);
      } catch (error) {
        console.error('Cloud sync initialization error:', error);
        setIsCloudSynced(false);
        setAuthError(
          'Signed in, but cloud sync could not connect to Firestore right now. Local storage remains active.'
        );
      }
    };

    bootstrapAndSubscribe();

    return () => {
      isCancelled = true;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user]);

  // Persist to localStorage for offline cache and guest users
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTER, JSON.stringify(dateFilter));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [dateFilter]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAMS, JSON.stringify(streams));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [streams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(incomeEntries));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [incomeEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenseEntries));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [expenseEntries]);

  // Cloud Sync Migration Helper
  const syncLocalToCloud = async (targetUser?: FirebaseUser | null) => {
    const activeUser = targetUser || user || auth.currentUser;
    if (!activeUser) return;
    const userId = activeUser.uid;
    const local = latestDataRef.current;

    try {
      const batch = writeBatch(db);

      // Save user doc
      const userRef = doc(db, 'users', userId);
      batch.set(
        userRef,
        {
          uid: userId,
          email: activeUser.email || '',
          displayName: activeUser.displayName || '',
          photoURL: activeUser.photoURL || '',
          currency: local.settings.currency,
          darkMode: local.settings.darkMode,
          monthlyBudgetGoal: local.settings.monthlyBudgetGoal || 50000,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Save all current streams
      for (const s of local.streams) {
        const streamRef = doc(db, 'users', userId, 'streams', s.id);
        batch.set(streamRef, {
          id: s.id,
          name: s.name,
          color: s.color || '#10b981',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Save all current categories
      for (const c of local.categories) {
        const catRef = doc(db, 'users', userId, 'categories', c.id);
        batch.set(catRef, {
          id: c.id,
          name: c.name,
          color: c.color || '#ef4444',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Save all income entries
      for (const inc of local.incomeEntries) {
        const incRef = doc(db, 'users', userId, 'incomeEntries', inc.id);
        batch.set(incRef, {
          id: inc.id,
          streamId: inc.streamId,
          clientName: inc.clientName,
          amount: Number(inc.amount) || 0,
          date: inc.date,
          isChecked: inc.isChecked,
          notes: inc.notes || '',
          createdAt: inc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Save all expense entries
      for (const exp of local.expenseEntries) {
        const expRef = doc(db, 'users', userId, 'expenseEntries', exp.id);
        batch.set(expRef, {
          id: exp.id,
          categoryId: exp.categoryId,
          name: exp.name,
          amount: Number(exp.amount) || 0,
          date: exp.date,
          isChecked: exp.isChecked,
          notes: exp.notes || '',
          createdAt: exp.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      setIsCloudSynced(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  // Auth actions
  const signInWithGoogle = async () => {
    if (isSigningIn) return;
    setAuthError(null);
    setIsSigningIn(true);
    try {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // Ignore persistence fallback errors in restricted storage environments
      }
      const credential = await signInWithPopup(auth, googleProvider);
      if (credential?.user) {
        setUser(credential.user);
        setAuthError(null);
      } else {
        setAuthError('Google Sign-In did not return a user session. Please check browser third-party cookie/storage settings and try again.');
      }
    } catch (error: unknown) {
      const err = error as { code?: string };
      const code = err?.code || '';
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      const isSameAuthOrigin =
        typeof window !== 'undefined' && window.location.hostname === FIREBASE_AUTH_DOMAIN;

      // Only fall back to redirect when authDomain matches the hosting domain
      // (cross-origin redirect fails silently in modern browsers due to storage partitioning)
      if (code === 'auth/popup-blocked' && !inIframe && isSameAuthOrigin) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.warn('Google Redirect Sign-In failed:', redirectError);
          setAuthError(getFriendlyAuthError(redirectError));
          return;
        }
      }

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(getFriendlyAuthError(error));
        return;
      }

      console.warn('Google Sign-In failed:', code || error);
      setAuthError(getFriendlyAuthError(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      await fbSignOut(auth);
      setUser(null);
      setIsCloudSynced(false);
    } catch (error) {
      console.error('Sign out failed', error);
      setAuthError('Could not sign out right now. Please try again.');
    }
  };

  // Stream CRUD
  const addStream = async (name: string, color: string = '#10b981'): Promise<string> => {
    const id = `str-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newStream: IncomeStream = {
      id,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    setStreams((prev) => [...prev, newStream]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'streams', id), {
          ...newStream,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/streams/${id}`);
      }
    }
    return id;
  };

  const updateStream = async (id: string, name: string, color?: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: name.trim(), color: color || s.color } : s))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'streams', id), {
          name: name.trim(),
          ...(color ? { color } : {}),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/streams/${id}`);
      }
    }
  };

  const deleteStream = async (id: string) => {
    setStreams((prev) => prev.filter((s) => s.id !== id));
    setIncomeEntries((prev) => prev.filter((e) => e.streamId !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'streams', id));
        // Delete child income entries in cloud
        const toDelete = incomeEntries.filter((e) => e.streamId === id);
        for (const item of toDelete) {
          await deleteDoc(doc(db, 'users', user.uid, 'incomeEntries', item.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/streams/${id}`);
      }
    }
  };

  // Category CRUD
  const addCategory = async (name: string, color: string = '#ef4444'): Promise<string> => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCategory: ExpenseCategory = {
      id,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCategory]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', id), {
          ...newCategory,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/categories/${id}`);
      }
    }
    return id;
  };

  const updateCategory = async (id: string, name: string, color?: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: name.trim(), color: color || c.color } : c))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), {
          name: name.trim(),
          ...(color ? { color } : {}),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/categories/${id}`);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setExpenseEntries((prev) => prev.filter((e) => e.categoryId !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
        const toDelete = expenseEntries.filter((e) => e.categoryId === id);
        for (const item of toDelete) {
          await deleteDoc(doc(db, 'users', user.uid, 'expenseEntries', item.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/categories/${id}`);
      }
    }
  };

  // Income entries CRUD
  const addIncomeEntry = async (entry: Omit<IncomeEntry, 'id' | 'createdAt'>) => {
    const id = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: IncomeEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };
    setIncomeEntries((prev) => [newEntry, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'incomeEntries', id), {
          ...newEntry,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/incomeEntries/${id}`);
      }
    }
  };

  const updateIncomeEntry = async (id: string, updated: Partial<IncomeEntry>) => {
    setIncomeEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'incomeEntries', id), {
          ...updated,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/incomeEntries/${id}`);
      }
    }
  };

  const deleteIncomeEntry = async (id: string) => {
    setIncomeEntries((prev) => prev.filter((item) => item.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'incomeEntries', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/incomeEntries/${id}`);
      }
    }
  };

  const toggleIncomeEntry = async (id: string) => {
    const item = incomeEntries.find((e) => e.id === id);
    if (!item) return;
    const newStatus = !item.isChecked;
    setIncomeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isChecked: newStatus } : e))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'incomeEntries', id), {
          isChecked: newStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/incomeEntries/${id}`);
      }
    }
  };

  const toggleAllIncomeInStream = async (streamId: string, checkAll: boolean) => {
    setIncomeEntries((prev) =>
      prev.map((item) => (item.streamId === streamId ? { ...item, isChecked: checkAll } : item))
    );

    if (user) {
      try {
        const streamItems = incomeEntries.filter((e) => e.streamId === streamId);
        const batch = writeBatch(db);
        for (const item of streamItems) {
          batch.update(doc(db, 'users', user.uid, 'incomeEntries', item.id), {
            isChecked: checkAll,
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/incomeEntries`);
      }
    }
  };

  // Expense entries CRUD
  const addExpenseEntry = async (entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: ExpenseEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };
    setExpenseEntries((prev) => [newEntry, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'expenseEntries', id), {
          ...newEntry,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/expenseEntries/${id}`);
      }
    }
  };

  const updateExpenseEntry = async (id: string, updated: Partial<ExpenseEntry>) => {
    setExpenseEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'expenseEntries', id), {
          ...updated,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/expenseEntries/${id}`);
      }
    }
  };

  const deleteExpenseEntry = async (id: string) => {
    setExpenseEntries((prev) => prev.filter((item) => item.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'expenseEntries', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/expenseEntries/${id}`);
      }
    }
  };

  const toggleExpenseEntry = async (id: string) => {
    const item = expenseEntries.find((e) => e.id === id);
    if (!item) return;
    const newStatus = !item.isChecked;
    setExpenseEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isChecked: newStatus } : e))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'expenseEntries', id), {
          isChecked: newStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/expenseEntries/${id}`);
      }
    }
  };

  const toggleAllExpenseInCategory = async (categoryId: string, checkAll: boolean) => {
    setExpenseEntries((prev) =>
      prev.map((item) => (item.categoryId === categoryId ? { ...item, isChecked: checkAll } : item))
    );

    if (user) {
      try {
        const catItems = expenseEntries.filter((e) => e.categoryId === categoryId);
        const batch = writeBatch(db);
        for (const item of catItems) {
          batch.update(doc(db, 'users', user.uid, 'expenseEntries', item.id), {
            isChecked: checkAll,
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/expenseEntries`);
      }
    }
  };

  // Month navigation
  const goToNextMonth = () => {
    const [yearStr, monthStr] = dateFilter.selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const nextMonth = `${year}-${String(month).padStart(2, '0')}`;
    setDateFilter((prev) => ({
      ...prev,
      type: 'current_month',
      selectedMonth: nextMonth,
    }));
  };

  const goToPreviousMonth = () => {
    const prevMonth = getPreviousMonthStr(dateFilter.selectedMonth);
    setDateFilter((prev) => ({
      ...prev,
      type: 'previous_month',
      selectedMonth: prevMonth,
    }));
  };

  const goToCurrentMonth = () => {
    const cur = getCurrentMonthStr();
    setDateFilter({
      type: 'current_month',
      selectedMonth: cur,
    });
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email || '',
            ...newSettings,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('Could not sync settings to cloud', error);
      }
    }
  };

  // Metrics computation (memoized and reactive)
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(streams, incomeEntries, categories, expenseEntries, dateFilter);
  }, [streams, incomeEntries, categories, expenseEntries, dateFilter]);

  // System actions
  const resetAllData = async () => {
    setStreams([]);
    setCategories([]);
    setIncomeEntries([]);
    setExpenseEntries([]);
    localStorage.removeItem(STORAGE_KEYS.STREAMS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INCOME);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);

    if (user) {
      try {
        const batch = writeBatch(db);
        streams.forEach((s) => batch.delete(doc(db, 'users', user.uid, 'streams', s.id)));
        categories.forEach((c) => batch.delete(doc(db, 'users', user.uid, 'categories', c.id)));
        incomeEntries.forEach((i) => batch.delete(doc(db, 'users', user.uid, 'incomeEntries', i.id)));
        expenseEntries.forEach((e) => batch.delete(doc(db, 'users', user.uid, 'expenseEntries', e.id)));
        await batch.commit();
      } catch (error) {
        console.warn('Reset cloud data batch failed', error);
      }
    }
  };

  const restoreSampleData = async () => {
    const initial = getInitialSampleData(getCurrentMonthStr());
    setStreams(initial.streams);
    setCategories(initial.categories);
    setIncomeEntries(initial.incomeEntries);
    setExpenseEntries(initial.expenseEntries);

    if (user) {
      try {
        const batch = writeBatch(db);
        initial.streams.forEach((s) =>
          batch.set(doc(db, 'users', user.uid, 'streams', s.id), {
            ...s,
            updatedAt: new Date().toISOString(),
          })
        );
        initial.categories.forEach((c) =>
          batch.set(doc(db, 'users', user.uid, 'categories', c.id), {
            ...c,
            updatedAt: new Date().toISOString(),
          })
        );
        initial.incomeEntries.forEach((i) =>
          batch.set(doc(db, 'users', user.uid, 'incomeEntries', i.id), {
            ...i,
            updatedAt: new Date().toISOString(),
          })
        );
        initial.expenseEntries.forEach((e) =>
          batch.set(doc(db, 'users', user.uid, 'expenseEntries', e.id), {
            ...e,
            updatedAt: new Date().toISOString(),
          })
        );
        await batch.commit();
      } catch (error) {
        console.warn('Restore sample data cloud write failed', error);
      }
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        user,
        authLoading,
        isSigningIn,
        authError,
        clearAuthError,
        isCloudSynced,
        signInWithGoogle,
        signOut,
        streams,
        categories,
        addStream,
        updateStream,
        deleteStream,
        addCategory,
        updateCategory,
        deleteCategory,
        incomeEntries,
        expenseEntries,
        addIncomeEntry,
        updateIncomeEntry,
        deleteIncomeEntry,
        toggleIncomeEntry,
        toggleAllIncomeInStream,
        addExpenseEntry,
        updateExpenseEntry,
        deleteExpenseEntry,
        toggleExpenseEntry,
        toggleAllExpenseInCategory,
        dateFilter,
        setDateFilter,
        goToNextMonth,
        goToPreviousMonth,
        goToCurrentMonth,
        settings,
        updateSettings,
        metrics,
        resetAllData,
        restoreSampleData,
        syncLocalToCloud,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
