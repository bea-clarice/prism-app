export interface Ledger {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  number: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  emoji: string;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  date: string;
}

export interface Profile {
  name: string;
  email: string;
}
