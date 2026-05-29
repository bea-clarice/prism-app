import { useMemo, useState } from 'react';
import { Banknote, ChevronLeft, CreditCard, ImagePlus, Plus, Wallet, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CategoryIcon } from './category-icons/CategoryIcon';
import type { Account, Category, Ledger, Transaction } from './types';
import { formatPeso } from '../utils/format';

interface AccountPageProps {
  activeLedger: Ledger | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  onAddAccount: (account: Omit<Account, 'id' | 'ledgerId'>) => void;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border">
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm mt-1">{body}</p>
    </div>
  );
}

function AddAccountModal({ onAdd, onClose }: { onAdd: (account: Omit<Account, 'id' | 'ledgerId'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    kind: 'bank' as Account['kind'],
    name: '',
    balance: '',
    number: '',
    qrImage: '',
  });

  const handleFileChange = (file?: File) => {
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, qrImage: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    const balance = parseFloat(form.balance);
    if (!form.name.trim() || isNaN(balance)) return;
    onAdd({
      kind: form.kind,
      name: form.name.trim(),
      balance,
      number: form.kind === 'bank' ? form.number.trim() : undefined,
      qrImage: form.kind === 'bank' ? form.qrImage : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Add an Account</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['bank', 'cash'] as const).map(kind => (
              <button key={kind} onClick={() => setForm(f => ({ ...f, kind }))} className={`py-3 rounded-xl text-sm font-semibold capitalize ${form.kind === kind ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {kind}
              </button>
            ))}
          </div>

          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Account name" autoFocus className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input type="number" min="0" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="Balance" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />

          {form.kind === 'bank' && (
            <>
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Account number" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
              <label className="block bg-muted rounded-xl p-4 cursor-pointer">
                <input type="file" accept="image/png,image/jpeg" onChange={e => handleFileChange(e.target.files?.[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-card flex items-center justify-center text-primary"><ImagePlus className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-semibold">QR code image optional</p>
                    <p className="text-xs text-muted-foreground">JPG or PNG</p>
                  </div>
                </div>
                {form.qrImage && <img src={form.qrImage} alt="QR preview" className="mt-3 w-24 h-24 rounded-xl object-cover border border-border" />}
              </label>
            </>
          )}

          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl p-3 font-semibold">Add Account</button>
        </div>
      </div>
    </div>
  );
}

function AccountDetailView({ account, transactions, categories, onBack }: { account: Account; transactions: Transaction[]; categories: Category[]; onBack: () => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : new Date().toISOString().split('T')[0];

  const accountTransactions = useMemo(() => transactions.filter(t => t.accountId === account.id), [transactions, account.id]);
  const dayTransactions = accountTransactions.filter(t => t.date === selectedDateStr);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const totalIncome = accountTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const renderTransaction = (transaction: Transaction, bordered: boolean) => {
    const category = getCategoryById(transaction.categoryId);
    return (
      <div key={transaction.id} className={`flex items-center justify-between p-4 ${bordered ? 'border-b border-border' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {category ? <CategoryIcon icon={category.icon} className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transaction.description || category?.name || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground">{category?.name || 'Unknown'} - {transaction.date}</p>
          </div>
        </div>
        <p className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="p-6 pb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary mb-4 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">My Accounts</span>
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate">{account.name}</h2>
            <p className="text-muted-foreground text-sm capitalize">{account.kind}{account.number ? ` - ${account.number}` : ''}</p>
            <p className="text-3xl font-bold text-primary mt-2">{formatPeso(account.balance)}</p>
          </div>
          {account.qrImage && <img src={account.qrImage} alt={`${account.name} QR code`} className="w-20 h-20 rounded-2xl object-cover border border-border" />}
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex justify-center">
          <style>{`
            .rdp-custom {
              --rdp-cell-size: 38px;
              margin: 0 auto;
              padding: 16px;
              width: 100%;
              max-width: 340px;
            }
            .rdp-custom .rdp-months,
            .rdp-custom .rdp-month,
            .rdp-custom .rdp-table {
              width: 100%;
              max-width: 100%;
            }
            .rdp-custom .rdp-caption {
              justify-content: center;
            }
            .rdp-custom .rdp-head_cell,
            .rdp-custom .rdp-cell {
              text-align: center;
            }
            .rdp-custom .rdp-day_selected:not(.rdp-day_disabled) {
              background-color: #ec4899 !important;
              color: white !important;
              border-radius: 50% !important;
            }
            .rdp-custom .rdp-day_today,
            .rdp-custom .rdp-caption_label {
              color: #ec4899 !important;
              font-weight: bold;
            }
          `}</style>
          <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rdp-custom" />
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-3 border border-green-100"><p className="text-xs text-green-600 mb-1">Total Income</p><p className="font-semibold text-green-700">{formatPeso(totalIncome)}</p></div>
          <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100"><p className="text-xs text-rose-600 mb-1">Total Expense</p><p className="font-semibold text-rose-700">{formatPeso(totalExpense)}</p></div>
          <div className="bg-card rounded-2xl p-3 border border-border"><p className="text-xs text-muted-foreground mb-1">Day Income</p><p className="font-semibold text-green-700">{formatPeso(dayIncome)}</p></div>
          <div className="bg-card rounded-2xl p-3 border border-border"><p className="text-xs text-muted-foreground mb-1">Day Expense</p><p className="font-semibold text-rose-700">{formatPeso(dayExpense)}</p></div>
        </div>
      </div>

      <div className="px-6 mb-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Selected Date</h3>
        {dayTransactions.length === 0 ? <EmptyState title="No transactions on this day" body="Add a transaction to display daily activity." /> : <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">{dayTransactions.map((t, i) => renderTransaction(t, i < dayTransactions.length - 1))}</div>}
      </div>

      <div className="px-6">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Transaction History</h3>
        {accountTransactions.length === 0 ? <EmptyState title="No transaction history yet" body="Add transactions from dashboard categories to display data." /> : <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">{accountTransactions.map((t, i) => renderTransaction(t, i < accountTransactions.length - 1))}</div>}
      </div>
    </div>
  );
}

export function AccountPage({ activeLedger, accounts, transactions, categories, onAddAccount }: AccountPageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);

  if (selectedAccount) {
    const current = accounts.find(account => account.id === selectedAccount.id) || selectedAccount;
    return <AccountDetailView account={current} transactions={transactions} categories={categories} onBack={() => setSelectedAccount(null)} />;
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">All Accounts</p>
          <h2 className="text-3xl font-bold">My Accounts</h2>
        </div>
        <button onClick={() => setAddingAccount(true)} disabled={!activeLedger} className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40" aria-label="Add an account">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <button onClick={() => setAddingAccount(true)} disabled={!activeLedger} className="w-full bg-card border border-border rounded-2xl p-4 mb-4 text-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        <Plus className="w-4 h-4" />
        Add an Account
      </button>

      <div className="space-y-4">
        {!activeLedger && <EmptyState title="No ledger selected" body="Add a ledger in Settings before adding accounts." />}
        {activeLedger && accounts.length === 0 && <EmptyState title="No accounts yet" body="Add an account to display balances and transactions." />}

        {accounts.map(account => {
          const Icon = account.kind === 'cash' ? Wallet : CreditCard;
          return (
            <button key={account.id} onClick={() => setSelectedAccount(account)} className="w-full bg-card rounded-3xl p-5 border border-border shadow-sm text-left hover:border-primary/50 active:scale-[0.98] transition-all">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.kind}</p>
                  </div>
                </div>
                {account.qrImage ? <img src={account.qrImage} alt={`${account.name} QR code`} className="w-14 h-14 rounded-xl object-cover border border-border" /> : account.kind === 'bank' && <Banknote className="w-5 h-5 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-foreground">{formatPeso(account.balance)}</p>
              {account.kind === 'bank' && <p className="text-sm text-muted-foreground mt-3">{account.number || 'No account number'}</p>}
            </button>
          );
        })}
      </div>

      {addingAccount && <AddAccountModal onAdd={onAddAccount} onClose={() => setAddingAccount(false)} />}
    </div>
  );
}
