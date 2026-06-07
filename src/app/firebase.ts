import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch,
} from 'firebase/firestore';
import type { Account, Bill, Category, Ledger, MoneyTransfer, Transaction } from './components/types';
import type { Profile } from './components/types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// ─── App + Auth + Firestore singletons ───────────────────────────────────────

const app = isFirebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Enable offline persistence (IndexedDB cache)
if (db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence works in only one tab at a time
      console.warn('[Prism] Offline persistence limited: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support IndexedDB
      console.warn('[Prism] Offline persistence not supported in this browser.');
    }
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<Profile> {
  if (!isFirebaseConfigured || !auth) {
    // Dev fallback when .env is not set up
    return {
      name: 'Google User',
      email: 'google.user@gmail.com',
      provider: 'firebase-google',
    };
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  return {
    name: user.displayName || 'Google User',
    email: user.email || '',
    photoUrl: user.photoURL || undefined,
    provider: 'firebase-google',
  };
}

export async function signOutUser(): Promise<void> {
  if (auth) await signOut(auth);
}

// ─── Firestore helpers ───────────────────────────────────────────────────────

type CollectionName = 'ledgers' | 'accounts' | 'categories' | 'transactions' | 'transfers' | 'bills';

function userCol(uid: string, col: CollectionName) {
  if (!db) throw new Error('Firestore not initialised');
  return collection(db, 'users', uid, col);
}

function userDoc(uid: string, col: CollectionName, id: string) {
  if (!db) throw new Error('Firestore not initialised');
  return doc(db, 'users', uid, col, id);
}

// ─── Save / delete helpers (called after local state is already updated) ─────

export const saveLedger = (uid: string, ledger: Ledger) =>
  setDoc(userDoc(uid, 'ledgers', ledger.id), ledger);

export const removeLedger = async (uid: string, id: string) => {
  // Delete the ledger doc and all child data in one batch
  if (!db) return;
  const batch = writeBatch(db);
  batch.delete(userDoc(uid, 'ledgers', id));
  // Child documents will be cleaned up by the delete functions called from App
  await batch.commit();
};

export const saveAccount = (uid: string, account: Account) =>
  setDoc(userDoc(uid, 'accounts', account.id), account);

export const removeAccount = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'accounts', id));

export const saveCategory = (uid: string, category: Category) =>
  setDoc(userDoc(uid, 'categories', category.id), category);

export const removeCategory = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'categories', id));

export const saveTransaction = (uid: string, tx: Transaction) =>
  setDoc(userDoc(uid, 'transactions', tx.id), tx);

export const removeTransaction = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'transactions', id));

export const saveTransfer = (uid: string, transfer: MoneyTransfer) =>
  setDoc(userDoc(uid, 'transfers', transfer.id), transfer);

export const removeTransfer = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'transfers', id));

export const saveBill = (uid: string, bill: Bill) =>
  setDoc(userDoc(uid, 'bills', bill.id), bill);

export const removeBill = (uid: string, id: string) =>
  deleteDoc(userDoc(uid, 'bills', id));

// ─── Real-time listener ───────────────────────────────────────────────────────

export interface UserData {
  ledgers: Ledger[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: MoneyTransfer[];
  bills: Bill[];
}

/**
 * Subscribes to all six sub-collections for a user.
 * Returns an unsubscribe function — call it on logout or unmount.
 * Works offline: Firestore serves cached data when there is no network.
 */
export function subscribeToUserData(
  uid: string,
  onChange: (key: keyof UserData, docs: unknown[]) => void,
): () => void {
  if (!db) return () => {};

  const cols: (keyof UserData)[] = [
    'ledgers', 'accounts', 'categories', 'transactions', 'transfers', 'bills',
  ];

  const unsubs = cols.map((col) =>
    onSnapshot(
      query(userCol(uid, col as CollectionName)),
      (snapshot) => onChange(col, snapshot.docs.map((d) => d.data())),
      (err) => console.error(`[Prism] Firestore error on ${col}:`, err),
    ),
  );

  return () => unsubs.forEach((u) => u());
}