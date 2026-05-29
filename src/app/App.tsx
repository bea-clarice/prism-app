import { useState } from 'react';
import { Home, User, Settings } from 'lucide-react';
import { DashboardPage } from './components/DashboardPage';
import { AccountPage } from './components/AccountPage';
import { SettingsPage } from './components/SettingsPage';
import type { Profile, Ledger, Account, Category, Transaction } from './components/types';

const today = new Date().toISOString().split('T')[0];

const initialLedgers: Ledger[] = [
  { id: 'l1', name: 'Personal' },
  { id: 'l2', name: 'Business' },
];

const initialAccounts: Account[] = [
  { id: 'a1', name: 'Main Account', balance: 12450.32, number: '****6789' },
  { id: 'a2', name: 'Savings', balance: 8900.00, number: '****1234' },
  { id: 'a3', name: 'Investment', balance: 15600.50, number: '****5678' },
];

const initialCategories: Category[] = [
  { id: 'c1', name: 'Salary', type: 'income', emoji: '💰', color: '#ec4899' },
  { id: 'c2', name: 'Freelance', type: 'income', emoji: '💻', color: '#f472b6' },
  { id: 'c3', name: 'Food', type: 'expense', emoji: '🍔', color: '#db2777' },
  { id: 'c4', name: 'Transport', type: 'expense', emoji: '🚗', color: '#be185d' },
  { id: 'c5', name: 'Entertainment', type: 'expense', emoji: '🎬', color: '#9d174d' },
  { id: 'c6', name: 'Utilities', type: 'expense', emoji: '💡', color: '#831843' },
];

const initialTransactions: Transaction[] = [
  { id: 't1', description: 'Monthly Salary', amount: 5456.67, type: 'income', categoryId: 'c1', accountId: 'a1', date: today },
  { id: 't2', description: 'Grocery Shopping', amount: 234.50, type: 'expense', categoryId: 'c3', accountId: 'a1', date: today },
  { id: 't3', description: 'Netflix', amount: 15.99, type: 'expense', categoryId: 'c5', accountId: 'a1', date: today },
  { id: 't4', description: 'Freelance Project', amount: 1200.00, type: 'income', categoryId: 'c2', accountId: 'a2', date: today },
  { id: 't5', description: 'Electric Bill', amount: 89.00, type: 'expense', categoryId: 'c6', accountId: 'a1', date: today },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Profile>({ name: 'John Doe', email: 'john.doe@email.com' });
  const [ledgers, setLedgers] = useState<Ledger[]>(initialLedgers);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...t, id: `t${Date.now()}` };
    setTransactions(prev => [newT, ...prev]);
    setAccounts(prev => prev.map(a => {
      if (a.id !== t.accountId) return a;
      const delta = t.type === 'income' ? t.amount : -t.amount;
      return { ...a, balance: a.balance + delta };
    }));
  };

  const addLedger = (name: string) =>
    setLedgers(prev => [...prev, { id: `l${Date.now()}`, name }]);

  const deleteLedger = (id: string) =>
    setLedgers(prev => prev.filter(l => l.id !== id));

  const addAccount = (a: Omit<Account, 'id'>) =>
    setAccounts(prev => [...prev, { ...a, id: `a${Date.now()}` }]);

  const deleteAccount = (id: string) =>
    setAccounts(prev => prev.filter(a => a.id !== id));

  const addCategory = (c: Omit<Category, 'id'>) =>
    setCategories(prev => [...prev, { ...c, id: `c${Date.now()}` }]);

  const deleteCategory = (id: string) =>
    setCategories(prev => prev.filter(c => c.id !== id));

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'account', label: 'Account', icon: User },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {activeTab === 'dashboard' && (
        <DashboardPage
          categories={categories}
          transactions={transactions}
          accounts={accounts}
          onAddTransaction={addTransaction}
        />
      )}

      {activeTab === 'account' && (
        <AccountPage
          accounts={accounts}
          transactions={transactions}
          categories={categories}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsPage
          profile={profile}
          ledgers={ledgers}
          accounts={accounts}
          categories={categories}
          onUpdateProfile={setProfile}
          onAddLedger={addLedger}
          onDeleteLedger={deleteLedger}
          onAddAccount={addAccount}
          onDeleteAccount={deleteAccount}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex items-center justify-around">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  activeTab === key ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === key ? 'bg-primary/10' : ''}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
