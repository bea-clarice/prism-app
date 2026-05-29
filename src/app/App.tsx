import { useMemo, useState } from 'react';
import { Home, ReceiptText, Settings, User } from 'lucide-react';
import { AccountPage } from './components/AccountPage';
import { AuthPage } from './components/AuthPage';
import { BillsPage } from './components/BillsPage';
import { DashboardPage } from './components/DashboardPage';
import { PrismLogo } from './components/PrismLogo';
import { SettingsPage } from './components/SettingsPage';
import type { Account, Bill, Category, Ledger, Profile, Transaction } from './components/types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeLedgerId, setActiveLedgerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: 'Google User',
    email: 'google.user@gmail.com',
    provider: 'firebase-google',
  });
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const activeLedger = ledgers.find(ledger => ledger.id === activeLedgerId) || null;

  const ledgerData = useMemo(() => {
    if (!activeLedgerId) {
      return { accounts: [], categories: [], transactions: [], bills: [] };
    }

    return {
      accounts: accounts.filter(account => account.ledgerId === activeLedgerId),
      categories: categories.filter(category => category.ledgerId === activeLedgerId),
      transactions: transactions.filter(transaction => transaction.ledgerId === activeLedgerId),
      bills: bills.filter(bill => bill.ledgerId === activeLedgerId),
    };
  }, [accounts, activeLedgerId, bills, categories, transactions]);

  const handleGoogleAuth = (nextProfile: Profile) => {
    setProfile(nextProfile);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const addLedger = (name: string) => {
    const ledger = { id: `l${Date.now()}`, name };
    setLedgers(prev => [...prev, ledger]);
    setActiveLedgerId(ledger.id);
  };

  const deleteLedger = (id: string) => {
    setLedgers(prev => {
      const next = prev.filter(ledger => ledger.id !== id);
      if (activeLedgerId === id) {
        setActiveLedgerId(next[0]?.id || null);
      }
      return next;
    });
    setAccounts(prev => prev.filter(account => account.ledgerId !== id));
    setCategories(prev => prev.filter(category => category.ledgerId !== id));
    setTransactions(prev => prev.filter(transaction => transaction.ledgerId !== id));
    setBills(prev => prev.filter(bill => bill.ledgerId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    const newTransaction: Transaction = { ...transaction, ledgerId: activeLedgerId, id: `t${Date.now()}` };
    setTransactions(prev => [newTransaction, ...prev]);
    setAccounts(prev => prev.map(account => {
      if (account.id !== transaction.accountId || account.ledgerId !== activeLedgerId) return account;
      const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      return { ...account, balance: account.balance + delta };
    }));
  };

  const addAccount = (account: Omit<Account, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    setAccounts(prev => [...prev, { ...account, ledgerId: activeLedgerId, id: `a${Date.now()}` }]);
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
    setTransactions(prev => prev.filter(transaction => transaction.accountId !== id));
  };

  const addCategory = (category: Omit<Category, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    setCategories(prev => [...prev, { ...category, ledgerId: activeLedgerId, id: `c${Date.now()}` }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
    setTransactions(prev => prev.filter(transaction => transaction.categoryId !== id));
  };

  const addBill = (bill: Omit<Bill, 'id' | 'paid' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    setBills(prev => [{ ...bill, ledgerId: activeLedgerId, id: `b${Date.now()}`, paid: false }, ...prev]);
  };

  const toggleBillPaid = (id: string) =>
    setBills(prev => prev.map(bill => bill.id === id ? { ...bill, paid: !bill.paid } : bill));

  const deleteBill = (id: string) =>
    setBills(prev => prev.filter(bill => bill.id !== id));

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'account', label: 'Accounts', icon: User },
    { key: 'bills', label: 'Bills', icon: ReceiptText },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isAuthenticated) {
    return <AuthPage onGoogleAuth={handleGoogleAuth} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-6 py-3 flex items-center gap-3">
          <PrismLogo className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none">Prism</p>
            {ledgers.length > 0 ? (
              <select
                value={activeLedgerId || ''}
                onChange={event => setActiveLedgerId(event.target.value)}
                className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
                aria-label="Active ledger"
              >
                {ledgers.map(ledger => (
                  <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Add a ledger to begin</p>
            )}
          </div>
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <DashboardPage
          activeLedger={activeLedger}
          categories={ledgerData.categories}
          transactions={ledgerData.transactions}
          accounts={ledgerData.accounts}
          onAddTransaction={addTransaction}
          onAddCategory={addCategory}
        />
      )}

      {activeTab === 'account' && (
        <AccountPage
          activeLedger={activeLedger}
          accounts={ledgerData.accounts}
          transactions={ledgerData.transactions}
          categories={ledgerData.categories}
          onAddAccount={addAccount}
        />
      )}

      {activeTab === 'bills' && (
        <BillsPage
          activeLedger={activeLedger}
          bills={ledgerData.bills}
          onAddBill={addBill}
          onTogglePaid={toggleBillPaid}
          onDeleteBill={deleteBill}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsPage
          profile={profile}
          ledgers={ledgers}
          activeLedgerId={activeLedgerId}
          accounts={ledgerData.accounts}
          categories={ledgerData.categories}
          onSelectLedger={setActiveLedgerId}
          onUpdateProfile={setProfile}
          onAddLedger={addLedger}
          onDeleteLedger={deleteLedger}
          onAddAccount={addAccount}
          onDeleteAccount={deleteAccount}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onLogout={logout}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="max-w-md mx-auto px-4 py-3">
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
