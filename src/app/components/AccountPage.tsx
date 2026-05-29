import { useMemo, useState } from 'react';
import { ChevronLeft, CreditCard, ImagePlus, Plus, Wallet, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CategoryIcon } from './category-icons/CategoryIcon';
import type { Account, Category, Ledger, Transaction } from './types';
import { formatDisplayDate, formatPeso } from '../utils/format';

interface AccountPageProps {
  activeLedger: Ledger | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  onAddAccount: (account: Omit<Account, 'id' | 'ledgerId'>) => void;
  onUpdateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onDeleteTransaction: (id: string) => void;
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

function EditTransactionModal({
  transaction,
  account,
  accounts,
  category,
  onSave,
  onDelete,
  onClose,
}: {
  transaction: Transaction;
  account: Account;
  accounts: Account[];
  category?: Category;
  onSave: (transaction: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [showPaymentItems, setShowPaymentItems] = useState(Boolean(transaction.paymentItems?.length));
  const [paymentItems, setPaymentItems] = useState(
    transaction.paymentItems?.map(item => ({ label: item.label, amount: String(item.amount) })) || []
  );
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [date, setDate] = useState(transaction.date);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const itemizedTotal = paymentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const addPaymentItem = () => {
    setShowPaymentItems(true);
    setPaymentItems(prev => [...prev, { label: '', amount: '' }]);
  };

  const updatePaymentItem = (index: number, key: 'label' | 'amount', value: string) => {
    setPaymentItems(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  const removePaymentItem = (index: number) => {
    setPaymentItems(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = () => {
    const parsed = showPaymentItems && paymentItems.length > 0 ? itemizedTotal : parseFloat(amount);
    if (date > today) {
      setError('Transactions cannot be saved for future dates.');
      return;
    }
    if (!parsed || !accountId) return;
    onSave({
      description: description.trim() || category?.name || 'Transaction',
      amount: parsed,
      paymentItems: showPaymentItems
        ? paymentItems
            .map(item => ({ label: item.label.trim(), amount: parseFloat(item.amount) || 0 }))
            .filter(item => item.amount > 0)
        : undefined,
      type: transaction.type,
      categoryId: transaction.categoryId,
      accountId,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold">Transaction Details</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your current balance is {formatPeso(account.balance)}.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Description" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          {!showPaymentItems && (
            <input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Amount" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          )}
          <div className="rounded-2xl bg-muted p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Add payments together</p>
                <p className="text-xs text-muted-foreground">Edit the same itemized inputs used for this transaction.</p>
              </div>
              <button onClick={addPaymentItem} className="bg-card text-primary rounded-xl px-3 py-2 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {showPaymentItems && (
              <div className="mt-3 space-y-2">
                {paymentItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_96px_32px] gap-2">
                    <input value={item.label} onChange={event => updatePaymentItem(index, 'label', event.target.value)} placeholder="Vehicle" className="min-w-0 bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                    <input type="number" min="0" step="0.01" value={item.amount} onChange={event => updatePaymentItem(index, 'amount', event.target.value)} placeholder="0.00" className="bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                    <button onClick={() => removePaymentItem(index)} className="bg-card rounded-xl text-rose-500 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Computed total</span>
                  <span className="font-semibold">{formatPeso(itemizedTotal)}</span>
                </div>
              </div>
            )}
          </div>
          <input type="date" max={today} value={date} onChange={event => setDate(event.target.value)} className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Account</p>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(nextAccount => (
                <button
                  key={nextAccount.id}
                  onClick={() => setAccountId(nextAccount.id)}
                  className={`rounded-xl p-3 text-left border ${
                    accountId === nextAccount.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{nextAccount.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{nextAccount.kind}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onDelete} className="rounded-xl p-3 bg-rose-50 text-rose-600 font-semibold">
              Delete
            </button>
            <button onClick={handleSave} className="rounded-xl p-3 bg-primary text-primary-foreground font-semibold">
              Save
            </button>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function AccountDetailView({
  account,
  accounts,
  transactions,
  categories,
  onBack,
  onUpdateTransaction,
  onDeleteTransaction,
}: {
  account: Account;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  onBack: () => void;
  onUpdateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showQr, setShowQr] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : new Date().toISOString().split('T')[0];

  const accountTransactions = useMemo(() => transactions.filter(t => t.accountId === account.id), [transactions, account.id]);
  const dayTransactions = accountTransactions.filter(t => t.date === selectedDateStr);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const transactionDates = useMemo(
    () => Array.from(new Set(accountTransactions.map(transaction => transaction.date))).map(date => new Date(`${date}T00:00:00`)),
    [accountTransactions]
  );

  const totalIncome = accountTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const renderTransaction = (transaction: Transaction, bordered: boolean) => {
    const category = getCategoryById(transaction.categoryId);
    return (
      <button
        key={transaction.id}
        onClick={() => setEditingTransaction(transaction)}
        className={`w-full flex items-center justify-between p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {category ? <CategoryIcon icon={category.icon} className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transaction.description || category?.name || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground">{category?.name || 'Unknown'} - {formatDisplayDate(transaction.date)}</p>
          </div>
        </div>
        <p className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
        </p>
      </button>
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
          {account.qrImage && (
            <button onClick={() => setShowQr(true)} className="w-20 h-20 rounded-2xl border border-border overflow-hidden">
              <img src={account.qrImage} alt={`${account.name} QR code`} className="w-full h-full object-cover" />
            </button>
          )}
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
            .rdp-custom .rdp-day_transaction:not(.rdp-day_selected) {
              background-color: #fce7f3 !important;
              color: #be185d !important;
              border-radius: 50% !important;
              font-weight: 700;
            }
            .rdp-custom .rdp-day_today,
            .rdp-custom .rdp-caption_label {
              color: #ec4899 !important;
              font-weight: bold;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ transaction: transactionDates }}
            modifiersClassNames={{ transaction: 'rdp-day_transaction' }}
            className="rdp-custom"
          />
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

      {showQr && account.qrImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setShowQr(false)}>
          <div className="bg-card rounded-3xl p-5 w-full max-w-sm" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">{account.name} QR Code</p>
              <button onClick={() => setShowQr(false)} className="p-2 rounded-full bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={account.qrImage} alt={`${account.name} QR code`} className="w-full aspect-square object-contain rounded-2xl bg-white p-3" />
          </div>
        </div>
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          account={account}
          accounts={accounts}
          category={getCategoryById(editingTransaction.categoryId)}
          onSave={transaction => onUpdateTransaction(editingTransaction.id, transaction)}
          onDelete={() => {
            onDeleteTransaction(editingTransaction.id);
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}

export function AccountPage({ activeLedger, accounts, transactions, categories, onAddAccount, onUpdateTransaction, onDeleteTransaction }: AccountPageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const getCategoryById = (id: string) => categories.find(category => category.id === id);
  const getAccountById = (id: string) => accounts.find(account => account.id === id);

  const renderAllTransaction = (transaction: Transaction, bordered: boolean) => {
    const category = getCategoryById(transaction.categoryId);
    const account = getAccountById(transaction.accountId);

    return (
      <button
        key={transaction.id}
        onClick={() => setEditingTransaction(transaction)}
        className={`w-full flex items-center justify-between p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {category ? <CategoryIcon icon={category.icon} className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transaction.description || category?.name || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground">
              {account?.name || 'Unknown account'} - {formatDisplayDate(transaction.date)}
            </p>
          </div>
        </div>
        <p className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
        </p>
      </button>
    );
  };

  if (selectedAccount) {
    const current = accounts.find(account => account.id === selectedAccount.id) || selectedAccount;
    return (
      <AccountDetailView
        account={current}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        onBack={() => setSelectedAccount(null)}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
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
          return (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className="w-full rounded-[24px] p-6 text-left text-white shadow-lg active:scale-[0.98] transition-all bg-gradient-to-br from-[#ec4899] via-[#f472b6] to-[#fbcfe8]"
            >
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm font-semibold truncate">{account.name}</p>
                {account.qrImage ? (
                  <img src={account.qrImage} alt={`${account.name} QR code`} className="w-8 h-8 rounded-lg object-cover border border-white/50" />
                ) : (
                  <CreditCard className="w-6 h-6 text-white" />
                )}
              </div>
              <p className="text-sm font-semibold text-white/90 mb-1">Balance</p>
              <p className="text-3xl font-bold">{formatPeso(account.balance)}</p>
              <p className="text-sm font-semibold text-white/90 mt-5">
                {account.kind === 'cash' ? 'Cash' : account.number || 'No account number'}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">All Transaction History</h3>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" body="Add transactions from dashboard categories to display all history." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {transactions.map((transaction, index) => renderAllTransaction(transaction, index < transactions.length - 1))}
          </div>
        )}
      </div>

      {addingAccount && <AddAccountModal onAdd={onAddAccount} onClose={() => setAddingAccount(false)} />}

      {editingTransaction && getAccountById(editingTransaction.accountId) && (
        <EditTransactionModal
          transaction={editingTransaction}
          account={getAccountById(editingTransaction.accountId)!}
          accounts={accounts}
          category={getCategoryById(editingTransaction.categoryId)}
          onSave={transaction => onUpdateTransaction(editingTransaction.id, transaction)}
          onDelete={() => {
            onDeleteTransaction(editingTransaction.id);
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
