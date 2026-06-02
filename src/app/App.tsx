import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, Home, ReceiptText, Settings, User, X } from 'lucide-react';
import { AccountPage } from './components/AccountPage';
import { AuthPage } from './components/AuthPage';
import { BillsPage } from './components/BillsPage';
import { DashboardPage } from './components/DashboardPage';
import { PrismLogo } from './components/PrismLogo';
import { SettingsPage } from './components/SettingsPage';
import type { Account, Bill, Category, Ledger, MoneyTransfer, Profile, Transaction } from './components/types';

const STORAGE_KEY = 'prism-app-state-v1';

interface PersistedState {
  isAuthenticated: boolean;
  activeTab: string;
  activeLedgerId: string | null;
  profile: Profile;
  ledgers: Ledger[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers?: MoneyTransfer[];
  bills: Bill[];
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export default function App() {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
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
  const [transfers, setTransfers] = useState<MoneyTransfer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ledgerPickerOpen, setLedgerPickerOpen] = useState(false);
  const ledgerPickerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as PersistedState;
          setIsAuthenticated(saved.isAuthenticated ?? false);
          setActiveTab(saved.activeTab || 'dashboard');
          setActiveLedgerId(saved.activeLedgerId || null);
          setProfile(saved.profile || profile);
          setLedgers(saved.ledgers || []);
          setAccounts(saved.accounts || []);
          setCategories(saved.categories || []);
          setTransactions(saved.transactions || []);
          setTransfers(saved.transfers || []);
          setBills(saved.bills || []);
          setNotificationsEnabled(saved.notificationsEnabled ?? true);
          setDarkMode(saved.darkMode ?? false);
        }
      } catch (error) {
        console.error('Unable to restore Prism data:', error);
      } finally {
        setIsSessionLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const closeHeaderMenus = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ledgerPickerRef.current && !ledgerPickerRef.current.contains(target)) {
        setLedgerPickerOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeHeaderMenus);
    return () => document.removeEventListener('pointerdown', closeHeaderMenus);
  }, []);

  useEffect(() => {
    if (isSessionLoading) return;
    const state: PersistedState = {
      isAuthenticated,
      activeTab,
      activeLedgerId,
      profile,
      ledgers,
      accounts,
      categories,
      transactions,
      transfers,
      bills,
      notificationsEnabled,
      darkMode,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    accounts,
    activeLedgerId,
    activeTab,
    bills,
    categories,
    darkMode,
    isAuthenticated,
    isSessionLoading,
    ledgers,
    notificationsEnabled,
    profile,
    transactions,
    transfers,
  ]);

  const activeLedger = ledgers.find(ledger => ledger.id === activeLedgerId) || null;

  const ledgerData = useMemo(() => {
    if (!activeLedgerId) {
      return { accounts: [], categories: [], transactions: [], transfers: [], bills: [] };
    }

    return {
      accounts: accounts.filter(account => account.ledgerId === activeLedgerId),
      categories: categories.filter(category => category.ledgerId === activeLedgerId),
      transactions: transactions.filter(transaction => transaction.ledgerId === activeLedgerId),
      transfers: transfers.filter(transfer => transfer.ledgerId === activeLedgerId),
      bills: bills.filter(bill => bill.ledgerId === activeLedgerId),
    };
  }, [accounts, activeLedgerId, bills, categories, transactions, transfers]);

  const billNotifications = useMemo(() => {
    if (!notificationsEnabled) return [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const soon = new Date(todayDate);
    soon.setDate(soon.getDate() + 3);

    return ledgerData.bills
      .filter(bill => !bill.paid)
      .map(bill => {
        const dueDate = new Date(`${bill.dueDate}T00:00:00`);
        const isOverdue = dueDate < todayDate;
        const isSoon = dueDate <= soon;
        if (!isOverdue && !isSoon) return null;
        return {
          id: bill.id,
          title: bill.name,
          body: isOverdue ? 'Overdue bill reminder' : 'Due soon',
          dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      })
      .filter(Boolean) as { id: string; title: string; body: string; dueDate: string }[];
  }, [ledgerData.bills, notificationsEnabled]);

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
    setTransfers(prev => prev.filter(transfer => transfer.ledgerId !== id));
    setBills(prev => prev.filter(bill => bill.ledgerId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    const accountBalanceAfter = (accounts.find(account => account.id === transaction.accountId && account.ledgerId === activeLedgerId)?.balance ?? 0) + delta;
    const newTransaction: Transaction = { ...transaction, accountBalanceAfter, ledgerId: activeLedgerId, id: `t${Date.now()}` };
    setTransactions(prev => [newTransaction, ...prev]);
    setAccounts(prev => prev.map(account => {
      if (account.id !== transaction.accountId || account.ledgerId !== activeLedgerId) return account;
      return { ...account, balance: account.balance + delta };
    }));
  };

  const updateTransaction = (id: string, nextTransaction: Omit<Transaction, 'id' | 'ledgerId'>) => {
    const currentTransaction = transactions.find(transaction => transaction.id === id);
    if (!currentTransaction || currentTransaction.ledgerId !== activeLedgerId) return;

    const oldDelta = currentTransaction.type === 'income' ? currentTransaction.amount : -currentTransaction.amount;
    const nextDelta = nextTransaction.type === 'income' ? nextTransaction.amount : -nextTransaction.amount;
    const nextAccount = accounts.find(account => account.id === nextTransaction.accountId && account.ledgerId === currentTransaction.ledgerId);
    const accountBalanceAfter = nextAccount
      ? nextAccount.balance - (nextAccount.id === currentTransaction.accountId ? oldDelta : 0) + nextDelta
      : nextTransaction.accountBalanceAfter;
    const updatedTransaction: Transaction = {
      ...nextTransaction,
      accountBalanceAfter,
      id,
      ledgerId: currentTransaction.ledgerId,
    };

    setTransactions(prev => prev.map(transaction => (
      transaction.id === id
        ? updatedTransaction
        : transaction
    )));

    setAccounts(prev => prev.map(account => {
      if (account.ledgerId !== currentTransaction.ledgerId) return account;

      let balance = account.balance;

      if (account.id === currentTransaction.accountId) balance -= oldDelta;
      if (account.id === nextTransaction.accountId) balance += nextDelta;

      return { ...account, balance };
    }));
  };

  const deleteTransaction = (id: string) => {
    const currentTransaction = transactions.find(transaction => transaction.id === id);
    if (!currentTransaction || currentTransaction.ledgerId !== activeLedgerId) return;

    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    setAccounts(prev => prev.map(account => {
      if (account.id !== currentTransaction.accountId) return account;
      const delta = currentTransaction.type === 'income' ? currentTransaction.amount : -currentTransaction.amount;
      return { ...account, balance: account.balance - delta };
    }));
  };

  const addAccount = (account: Omit<Account, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    setAccounts(prev => [...prev, { ...account, ledgerId: activeLedgerId, id: `a${Date.now()}` }]);
  };

  const addTransfer = (transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => {
    if (!activeLedgerId) return;
    const fromAccount = accounts.find(account => account.id === transfer.fromAccountId && account.ledgerId === activeLedgerId);
    const toAccount = accounts.find(account => account.id === transfer.toAccountId && account.ledgerId === activeLedgerId);
    if (!fromAccount || !toAccount || fromAccount.id === toAccount.id || transfer.amount <= 0 || fromAccount.balance < transfer.amount) return;

    const newTransfer: MoneyTransfer = {
      ...transfer,
      note: transfer.note?.trim() || undefined,
      ledgerId: activeLedgerId,
      id: `m${Date.now()}`,
    };

    setTransfers(prev => [newTransfer, ...prev]);
    setAccounts(prev => prev.map(account => {
      if (account.ledgerId !== activeLedgerId) return account;
      if (account.id === transfer.fromAccountId) return { ...account, balance: account.balance - transfer.amount };
      if (account.id === transfer.toAccountId) return { ...account, balance: account.balance + transfer.amount };
      return account;
    }));
  };

  const updateTransfer = (id: string, nextTransfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => {
    const currentTransfer = transfers.find(transfer => transfer.id === id);
    if (!currentTransfer || currentTransfer.ledgerId !== activeLedgerId) return;

    const fromAccount = accounts.find(account => account.id === nextTransfer.fromAccountId && account.ledgerId === currentTransfer.ledgerId);
    const toAccount = accounts.find(account => account.id === nextTransfer.toAccountId && account.ledgerId === currentTransfer.ledgerId);
    if (!fromAccount || !toAccount || fromAccount.id === toAccount.id || nextTransfer.amount <= 0) return;

    let availableBalance = fromAccount.balance;
    if (fromAccount.id === currentTransfer.fromAccountId) availableBalance += currentTransfer.amount;
    if (fromAccount.id === currentTransfer.toAccountId) availableBalance -= currentTransfer.amount;
    if (availableBalance < nextTransfer.amount) return;

    const updatedTransfer: MoneyTransfer = {
      ...nextTransfer,
      note: nextTransfer.note?.trim() || undefined,
      id,
      ledgerId: currentTransfer.ledgerId,
    };

    setTransfers(prev => prev.map(transfer => (
      transfer.id === id
        ? updatedTransfer
        : transfer
    )));

    setAccounts(prev => prev.map(account => {
      if (account.ledgerId !== currentTransfer.ledgerId) return account;

      let balance = account.balance;
      if (account.id === currentTransfer.fromAccountId) balance += currentTransfer.amount;
      if (account.id === currentTransfer.toAccountId) balance -= currentTransfer.amount;
      if (account.id === nextTransfer.fromAccountId) balance -= nextTransfer.amount;
      if (account.id === nextTransfer.toAccountId) balance += nextTransfer.amount;

      return { ...account, balance };
    }));
  };

  const deleteTransfer = (id: string) => {
    const currentTransfer = transfers.find(transfer => transfer.id === id);
    if (!currentTransfer || currentTransfer.ledgerId !== activeLedgerId) return;

    setTransfers(prev => prev.filter(transfer => transfer.id !== id));
    setAccounts(prev => prev.map(account => {
      if (account.ledgerId !== currentTransfer.ledgerId) return account;
      if (account.id === currentTransfer.fromAccountId) return { ...account, balance: account.balance + currentTransfer.amount };
      if (account.id === currentTransfer.toAccountId) return { ...account, balance: account.balance - currentTransfer.amount };
      return account;
    }));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
    setTransactions(prev => prev.filter(transaction => transaction.accountId !== id));
    setTransfers(prev => prev.filter(transfer => transfer.fromAccountId !== id && transfer.toAccountId !== id));
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

  const markBillPaid = (id: string, payment: { paidBy: 'account' | 'other'; accountId?: string }) => {
    const bill = bills.find(nextBill => nextBill.id === id);
    if (!bill || bill.ledgerId !== activeLedgerId || bill.paid) return;

    setBills(prev => prev.map(nextBill => (
      nextBill.id === id
        ? { ...nextBill, paid: true, paidBy: payment.paidBy, paidAccountId: payment.paidBy === 'account' ? payment.accountId : undefined }
        : nextBill
    )));

    if (payment.paidBy === 'account' && payment.accountId) {
      setAccounts(prev => prev.map(account => (
        account.id === payment.accountId && account.ledgerId === bill.ledgerId
          ? { ...account, balance: account.balance - bill.amount }
          : account
      )));
    }
  };

  const deleteBill = (id: string) =>
    setBills(prev => prev.filter(bill => bill.id !== id));

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'account', label: 'Accounts', icon: User },
    { key: 'bills', label: 'Bills', icon: ReceiptText },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <div>
          <PrismLogo className="h-24 w-24 mx-auto mb-4" />
          <p className="font-semibold">Loading Prism</p>
          <p className="text-sm text-muted-foreground mt-1">Restoring your saved data on this device.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onGoogleAuth={handleGoogleAuth} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-6 py-3 flex items-center gap-3 relative">
          <PrismLogo className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none">Prism</p>
            {ledgers.length > 0 ? (
              <div ref={ledgerPickerRef} className="relative mt-1">
                <button
                  onClick={() => {
                    setLedgerPickerOpen(open => !open);
                    setNotificationsOpen(false);
                  }}
                  className="inline-flex max-w-full items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  aria-label="Choose ledger"
                >
                  <span className="truncate">{activeLedger?.name || 'Choose ledger'}</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </button>
                {ledgerPickerOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl p-2 z-50">
                    {ledgers.map(ledger => (
                      <button
                        key={ledger.id}
                        onClick={() => {
                          setActiveLedgerId(ledger.id);
                          setLedgerPickerOpen(false);
                        }}
                        className={`w-full text-left rounded-xl px-3 py-2 text-sm ${
                          activeLedgerId === ledger.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                      >
                        {ledger.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Add a ledger to begin</p>
            )}
          </div>
          <div ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(open => !open);
                setLedgerPickerOpen(false);
              }}
              className="relative h-10 w-10 rounded-2xl bg-muted text-primary flex items-center justify-center"
              aria-label="Recent notifications"
            >
              <Bell className="w-5 h-5" />
              {billNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                  {billNotifications.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-6 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold">Recent notifications</p>
                  <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-lg bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {!notificationsEnabled ? (
                  <p className="text-sm text-muted-foreground">Bill reminders are turned off.</p>
                ) : billNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bill reminders right now.</p>
                ) : (
                  <div className="space-y-2">
                    {billNotifications.map(notification => (
                      <div key={notification.id} className="rounded-xl bg-muted p-3">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.body} - {notification.dueDate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          transfers={ledgerData.transfers}
          categories={ledgerData.categories}
          onAddAccount={addAccount}
          onAddTransfer={addTransfer}
          onUpdateTransfer={updateTransfer}
          onDeleteTransfer={deleteTransfer}
          onUpdateTransaction={updateTransaction}
          onDeleteTransaction={deleteTransaction}
        />
      )}

      {activeTab === 'bills' && (
        <BillsPage
          activeLedger={activeLedger}
          bills={ledgerData.bills}
          accounts={ledgerData.accounts}
          onAddBill={addBill}
          onMarkPaid={markBillPaid}
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
          notificationsEnabled={notificationsEnabled}
          onSetNotificationsEnabled={setNotificationsEnabled}
          darkMode={darkMode}
          onSetDarkMode={setDarkMode}
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
