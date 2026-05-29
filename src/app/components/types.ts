export interface Ledger {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  ledgerId: string;
  name: string;
  balance: number;
  number?: string;
  kind: 'bank' | 'cash';
  qrImage?: string;
}

export type CategoryIconKey =
  | 'wallet'
  | 'laptop'
  | 'utensils'
  | 'car'
  | 'film'
  | 'lightbulb'
  | 'home'
  | 'shopping'
  | 'heart'
  | 'book'
  | 'plane'
  | 'tag';

export interface Category {
  id: string;
  ledgerId: string;
  name: string;
  type: 'income' | 'expense';
  icon: CategoryIconKey;
  color: string;
}

export interface Transaction {
  id: string;
  ledgerId: string;
  description: string;
  amount: number;
  paymentItems?: { label: string; amount: number }[];
  accountBalanceAfter?: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  date: string;
}

export interface Profile {
  name: string;
  email: string;
  photoUrl?: string;
  provider?: 'firebase-google' | 'local';
}

export interface Bill {
  id: string;
  ledgerId: string;
  name: string;
  amount: number;
  dueDate: string;
  recurring: 'monthly' | 'quarterly' | 'biannually' | 'annually' | 'manual';
  paid: boolean;
}
