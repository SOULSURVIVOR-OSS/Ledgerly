import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

function isValidEnvOverride(
  value: string | undefined,
  validator: (v: string) => boolean
): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('YOUR_') || trimmed.startsWith('MY_')) {
    return false;
  }
  return validator(trimmed);
}

const env = import.meta.env;

const hasCustomProject = isValidEnvOverride(
  env.VITE_FIREBASE_PROJECT_ID,
  (v) => v.length >= 4 && !/\s/.test(v) && v !== 'projectId'
);

const firebaseConfig = {
  projectId: hasCustomProject ? env.VITE_FIREBASE_PROJECT_ID!.trim() : rawConfig.projectId,
  appId: isValidEnvOverride(env.VITE_FIREBASE_APP_ID, (v) =>
    /^\d+:\d+:web:[a-f0-9]+$/i.test(v)
  )
    ? env.VITE_FIREBASE_APP_ID.trim()
    : rawConfig.appId,
  apiKey: isValidEnvOverride(
    env.VITE_FIREBASE_API_KEY,
    (v) => v.startsWith('AIza') && v.length > 20
  )
    ? env.VITE_FIREBASE_API_KEY.trim()
    : rawConfig.apiKey,
  authDomain: isValidEnvOverride(
    env.VITE_FIREBASE_AUTH_DOMAIN,
    (v) => v.includes('.') && !/\s/.test(v)
  )
    ? env.VITE_FIREBASE_AUTH_DOMAIN.trim()
    : hasCustomProject
    ? `${env.VITE_FIREBASE_PROJECT_ID!.trim()}.firebaseapp.com`
    : rawConfig.authDomain,
  firestoreDatabaseId: isValidEnvOverride(
    env.VITE_FIREBASE_DATABASE_ID,
    (v) => !/\s/.test(v) && v !== 'firestoreDatabaseId'
  )
    ? env.VITE_FIREBASE_DATABASE_ID.trim()
    : hasCustomProject
    ? '(default)'
    : rawConfig.firestoreDatabaseId || '(default)',
  storageBucket: isValidEnvOverride(
    env.VITE_FIREBASE_STORAGE_BUCKET,
    (v) => v.includes('.') && !/\s/.test(v)
  )
    ? env.VITE_FIREBASE_STORAGE_BUCKET.trim()
    : hasCustomProject
    ? `${env.VITE_FIREBASE_PROJECT_ID!.trim()}.firebasestorage.app`
    : rawConfig.storageBucket,
  messagingSenderId: isValidEnvOverride(
    env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    (v) => /^\d{6,}$/.test(v)
  )
    ? env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim()
    : rawConfig.messagingSenderId,
};

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection check indicated client offline');
    }
    return false;
  }
}
