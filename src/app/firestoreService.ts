import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import type { Account, Bill, Category, Transaction, Ledger } from './components/types';

const userCol = (uid: string, col: string) =>
  collection(db, 'users', uid, col);

// Ledgers
export const saveLedger = (uid: string, ledger: Ledger) =>
  setDoc(doc(userCol(uid, 'ledgers'), ledger.id), ledger);

export const deleteLedger = (uid: string, id: string) =>
  deleteDoc(doc(userCol(uid, 'ledgers'), id));

// Accounts
export const saveAccount = (uid: string, account: Account) =>
  setDoc(doc(userCol(uid, 'accounts'), account.id), account);

export const deleteAccount = (uid: string, id: string) =>
  deleteDoc(doc(userCol(uid, 'accounts'), id));

// Transactions
export const saveTransaction = (uid: string, tx: Transaction) =>
  setDoc(doc(userCol(uid, 'transactions'), tx.id), tx);

// Bills
export const saveBill = (uid: string, bill: Bill) =>
  setDoc(doc(userCol(uid, 'bills'), bill.id), bill);

export const deleteBill = (uid: string, id: string) =>
  deleteDoc(doc(userCol(uid, 'bills'), id));

// Categories
export const saveCategory = (uid: string, cat: Category) =>
  setDoc(doc(userCol(uid, 'categories'), cat.id), cat);

export const deleteCategory = (uid: string, id: string) =>
  deleteDoc(doc(userCol(uid, 'categories'), id));

// Real-time listener for all user data
export const subscribeToUserData = (
  uid: string,
  onData: (col: string, docs: any[]) => void
) => {
  const collections = ['ledgers', 'accounts', 'transactions', 'bills', 'categories'];
  const unsubs = collections.map(col =>
    onSnapshot(query(userCol(uid, col)), snapshot => {
      onData(col, snapshot.docs.map(d => d.data()));
    })
  );
  return () => unsubs.forEach(u => u()); // cleanup
};