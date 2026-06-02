import { useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronLeft, CreditCard, ImagePlus, Pencil, Plus, Wallet, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CategoryIcon } from './category-icons/CategoryIcon';
import type { Account, Category, Ledger, MoneyTransfer, Transaction } from './types';
import { formatDisplayDate, formatPeso, getPhilippineDate, getPhilippineDateString } from '../utils/format';

interface AccountPageProps {
  activeLedger: Ledger | null;
  accounts: Account[];
  transactions: Transaction[];
  transfers: MoneyTransfer[];
  categories: Category[];
  onAddAccount: (account: Omit<Account, 'id' | 'ledgerId'>) => void;
  onAddTransfer: (transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => void;
  onUpdateTransfer: (id: string, transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => void;
  onDeleteTransfer: (id: string) => void;
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

function TransferMoneyModal({
  accounts,
  onAdd,
  onClose,
}: {
  accounts: Account[];
  onAdd: (transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => void;
  onClose: () => void;
}) {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts.find(account => account.id !== accounts[0]?.id)?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getPhilippineDateString());
  const [error, setError] = useState('');
  const today = getPhilippineDateString();

  const fromAccount = accounts.find(account => account.id === fromAccountId);
  const toAccount = accounts.find(account => account.id === toAccountId);

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (date > today) {
      setError('Transfers cannot be added for future dates.');
      return;
    }
    if (!fromAccount || !toAccount || fromAccount.id === toAccount.id) {
      setError('Choose two different accounts.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid transfer amount.');
      return;
    }
    if (fromAccount.balance < parsedAmount) {
      setError(`${fromAccount.name} does not have enough balance.`);
      return;
    }

    onAdd({
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount: parsedAmount,
      note: note.trim() || undefined,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold">Transfer Money</h3>
              <p className="text-sm text-muted-foreground">Move funds between your accounts.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Amount" autoFocus className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input value={note} onChange={event => setNote(event.target.value)} placeholder="Note optional" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input type="date" max={today} value={date} onChange={event => setDate(event.target.value)} className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">From</p>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => {
                    setFromAccountId(account.id);
                    if (toAccountId === account.id) {
                      setToAccountId(accounts.find(nextAccount => nextAccount.id !== account.id)?.id || '');
                    }
                  }}
                  className={`rounded-xl p-3 text-left border ${
                    fromAccountId === account.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPeso(account.balance)}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">To</p>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setToAccountId(account.id)}
                  disabled={account.id === fromAccountId}
                  className={`rounded-xl p-3 text-left border disabled:opacity-40 ${
                    toAccountId === account.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPeso(account.balance)}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground rounded-xl p-3 font-semibold">
            Transfer Money
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferDetailsModal({
  transfer,
  accounts,
  onSave,
  onDelete,
  onClose,
}: {
  transfer: MoneyTransfer;
  accounts: Account[];
  onSave: (transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [fromAccountId, setFromAccountId] = useState(transfer.fromAccountId);
  const [toAccountId, setToAccountId] = useState(transfer.toAccountId);
  const [amount, setAmount] = useState(String(transfer.amount));
  const [note, setNote] = useState(transfer.note || '');
  const [date, setDate] = useState(transfer.date);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const today = getPhilippineDateString();
  const fromAccount = accounts.find(account => account.id === transfer.fromAccountId);
  const toAccount = accounts.find(account => account.id === transfer.toAccountId);
  const editingFromAccount = accounts.find(account => account.id === fromAccountId);
  const editingToAccount = accounts.find(account => account.id === toAccountId);

  const getAvailableBalance = (account: Account) => {
    let balance = account.balance;
    if (account.id === transfer.fromAccountId) balance += transfer.amount;
    if (account.id === transfer.toAccountId) balance -= transfer.amount;
    return balance;
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (date > today) {
      setError('Transfers cannot be saved for future dates.');
      return;
    }
    if (!editingFromAccount || !editingToAccount || editingFromAccount.id === editingToAccount.id) {
      setError('Choose two different accounts.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid transfer amount.');
      return;
    }
    if (getAvailableBalance(editingFromAccount) < parsedAmount) {
      setError(`${editingFromAccount.name} does not have enough balance.`);
      return;
    }

    onSave({
      fromAccountId: editingFromAccount.id,
      toAccountId: editingToAccount.id,
      amount: parsedAmount,
      note: note.trim() || undefined,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-semibold">Transfer Details</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {fromAccount?.name || 'Unknown account'} to {toAccount?.name || 'Unknown account'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="font-semibold mt-1">{transfer.note || 'Money transfer'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold text-primary mt-1">{formatPeso(transfer.amount)}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold mt-1">{formatDisplayDate(transfer.date)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-semibold mt-1 truncate">{fromAccount?.name || 'Unknown'}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-semibold mt-1 truncate">{toAccount?.name || 'Unknown'}</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full rounded-xl p-3 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Amount" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
            <input value={note} onChange={event => setNote(event.target.value)} placeholder="Note optional" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
            <input type="date" max={today} value={date} onChange={event => setDate(event.target.value)} className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />

            <div>
              <p className="text-sm text-muted-foreground mb-2">From</p>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setFromAccountId(account.id);
                      if (toAccountId === account.id) {
                        setToAccountId(accounts.find(nextAccount => nextAccount.id !== account.id)?.id || '');
                      }
                    }}
                    className={`rounded-xl p-3 text-left border ${
                      fromAccountId === account.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm font-semibold truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPeso(getAvailableBalance(account))}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">To</p>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => setToAccountId(account.id)}
                    disabled={account.id === fromAccountId}
                    className={`rounded-xl p-3 text-left border disabled:opacity-40 ${
                      toAccountId === account.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm font-semibold truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPeso(getAvailableBalance(account))}</p>
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
        )}
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
  const [isEditing, setIsEditing] = useState(false);

  const today = getPhilippineDateString();
  const itemizedTotal = paymentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const balanceAfterTransaction = transaction.accountBalanceAfter ?? account.balance;
  const selectedAccount = accounts.find(nextAccount => nextAccount.id === transaction.accountId) || account;
  const editingAccount = accounts.find(nextAccount => nextAccount.id === accountId);
  const savedPaymentItems = transaction.paymentItems || [];

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
      accountBalanceAfter: transaction.accountBalanceAfter,
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
              Your current balance was {formatPeso(balanceAfterTransaction)} on this transaction.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="font-semibold mt-1">{transaction.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className={`font-semibold mt-1 ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
                </p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold mt-1">{formatDisplayDate(transaction.date)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-semibold mt-1 truncate">{selectedAccount.name}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold mt-1 truncate">{category?.name || 'Unknown'}</p>
              </div>
            </div>
            {savedPaymentItems.length > 0 && (
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-3">Payment items</p>
                <div className="space-y-2">
                  {savedPaymentItems.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{item.label || `Item ${index + 1}`}</span>
                      <span className="font-semibold">{formatPeso(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setIsEditing(true)} className="w-full rounded-xl p-3 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
        ) : (
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
              <button onClick={handleSave} disabled={!editingAccount} className="rounded-xl p-3 bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                Save
              </button>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountDetailView({
  account,
  accounts,
  transactions,
  transfers,
  categories,
  onBack,
  onUpdateTransfer,
  onDeleteTransfer,
  onUpdateTransaction,
  onDeleteTransaction,
}: {
  account: Account;
  accounts: Account[];
  transactions: Transaction[];
  transfers: MoneyTransfer[];
  categories: Category[];
  onBack: () => void;
  onUpdateTransfer: (id: string, transfer: Omit<MoneyTransfer, 'id' | 'ledgerId'>) => void;
  onDeleteTransfer: (id: string) => void;
  onUpdateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getPhilippineDate());
  const [showQr, setShowQr] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<MoneyTransfer | null>(null);

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : getPhilippineDateString();

  const accountTransactions = useMemo(() => transactions.filter(t => t.accountId === account.id), [transactions, account.id]);
  const accountTransfers = useMemo(
    () => transfers.filter(transfer => transfer.fromAccountId === account.id || transfer.toAccountId === account.id),
    [transfers, account.id]
  );
  const dayTransactions = accountTransactions.filter(t => t.date === selectedDateStr);
  const dayTransfers = accountTransfers.filter(transfer => transfer.date === selectedDateStr);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getAccountById = (id: string) => accounts.find(nextAccount => nextAccount.id === id);
  const transactionDates = useMemo(
    () => Array.from(new Set([...accountTransactions.map(transaction => transaction.date), ...accountTransfers.map(transfer => transfer.date)])).map(date => new Date(`${date}T00:00:00`)),
    [accountTransactions, accountTransfers]
  );

  const totalIncome = accountTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const transferIn = accountTransfers.filter(transfer => transfer.toAccountId === account.id).reduce((sum, transfer) => sum + transfer.amount, 0);
  const transferOut = accountTransfers.filter(transfer => transfer.fromAccountId === account.id).reduce((sum, transfer) => sum + transfer.amount, 0);

  const renderTransaction = (transaction: Transaction, bordered: boolean) => {
    const category = getCategoryById(transaction.categoryId);
    return (
      <button
        key={transaction.id}
        onClick={() => setEditingTransaction(transaction)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {category ? <CategoryIcon icon={category.icon} className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transaction.description || category?.name || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground truncate">{category?.name || 'Unknown'} - {formatDisplayDate(transaction.date)}</p>
          </div>
        </div>
        <p className={`flex-shrink-0 text-right font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
        </p>
      </button>
    );
  };

  const renderTransfer = (transfer: MoneyTransfer, bordered: boolean) => {
    const isIncoming = transfer.toAccountId === account.id;
    const otherAccount = getAccountById(isIncoming ? transfer.fromAccountId : transfer.toAccountId);

    return (
      <button
        key={transfer.id}
        onClick={() => setEditingTransfer(transfer)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transfer.note || (isIncoming ? 'Transfer in' : 'Transfer out')}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isIncoming ? 'From' : 'To'} {otherAccount?.name || 'Unknown account'} - {formatDisplayDate(transfer.date)}
            </p>
          </div>
        </div>
        <p className={`flex-shrink-0 text-right font-semibold text-sm ${isIncoming ? 'text-green-600' : 'text-rose-500'}`}>
          {isIncoming ? '+' : '-'}{formatPeso(transfer.amount)}
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
          <div className="bg-card rounded-2xl p-3 border border-border"><p className="text-xs text-muted-foreground mb-1">Transfer In</p><p className="font-semibold text-green-700">{formatPeso(transferIn)}</p></div>
          <div className="bg-card rounded-2xl p-3 border border-border"><p className="text-xs text-muted-foreground mb-1">Transfer Out</p><p className="font-semibold text-rose-700">{formatPeso(transferOut)}</p></div>
        </div>
      </div>

      <div className="px-6 mb-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Selected Date</h3>
        {dayTransactions.length === 0 && dayTransfers.length === 0 ? (
          <EmptyState title="No activity on this day" body="Add a transaction or transfer to display daily activity." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {[...dayTransfers, ...dayTransactions].map((item, index, items) => (
              'fromAccountId' in item
                ? renderTransfer(item, index < items.length - 1)
                : renderTransaction(item, index < items.length - 1)
            ))}
          </div>
        )}
      </div>

      <div className="px-6">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Transaction History</h3>
        {accountTransactions.length === 0 ? <EmptyState title="No transaction history yet" body="Add transactions from dashboard categories to display data." /> : <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">{accountTransactions.map((t, i) => renderTransaction(t, i < accountTransactions.length - 1))}</div>}
      </div>

      <div className="px-6 mt-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Transfer History</h3>
        {accountTransfers.length === 0 ? <EmptyState title="No transfers yet" body="Move money between accounts to display transfer history." /> : <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">{accountTransfers.map((transfer, index) => renderTransfer(transfer, index < accountTransfers.length - 1))}</div>}
      </div>

      {showQr && account.qrImage && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <button onClick={() => setShowQr(false)} className="absolute right-4 top-4 z-10 p-3 rounded-full bg-white/10 text-white backdrop-blur" aria-label="Close QR code">
            <X className="w-5 h-5" />
          </button>
          <img src={account.qrImage} alt={`${account.name} QR code`} className="max-h-full max-w-full object-contain bg-white p-4" onClick={event => event.stopPropagation()} />
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

      {editingTransfer && (
        <TransferDetailsModal
          transfer={editingTransfer}
          accounts={accounts}
          onSave={transfer => onUpdateTransfer(editingTransfer.id, transfer)}
          onDelete={() => {
            onDeleteTransfer(editingTransfer.id);
            setEditingTransfer(null);
          }}
          onClose={() => setEditingTransfer(null)}
        />
      )}
    </div>
  );
}

export function AccountPage({ activeLedger, accounts, transactions, transfers, categories, onAddAccount, onAddTransfer, onUpdateTransfer, onDeleteTransfer, onUpdateTransaction, onDeleteTransaction }: AccountPageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<MoneyTransfer | null>(null);

  const getCategoryById = (id: string) => categories.find(category => category.id === id);
  const getAccountById = (id: string) => accounts.find(account => account.id === id);
  const canTransfer = Boolean(activeLedger && accounts.length >= 2);

  const renderAllTransaction = (transaction: Transaction, bordered: boolean) => {
    const category = getCategoryById(transaction.categoryId);
    const account = getAccountById(transaction.accountId);

    return (
      <button
        key={transaction.id}
        onClick={() => setEditingTransaction(transaction)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {category ? <CategoryIcon icon={category.icon} className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transaction.description || category?.name || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {account?.name || 'Unknown account'} - {formatDisplayDate(transaction.date)}
            </p>
          </div>
        </div>
        <p className={`flex-shrink-0 text-right font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatPeso(transaction.amount)}
        </p>
      </button>
    );
  };

  const renderTransfer = (transfer: MoneyTransfer, bordered: boolean) => {
    const fromAccount = getAccountById(transfer.fromAccountId);
    const toAccount = getAccountById(transfer.toAccountId);

    return (
      <button
        key={transfer.id}
        onClick={() => setEditingTransfer(transfer)}
        className={`w-full flex items-center justify-between gap-3 p-4 text-left ${bordered ? 'border-b border-border' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{transfer.note || 'Money transfer'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {fromAccount?.name || 'Unknown'} to {toAccount?.name || 'Unknown'} - {formatDisplayDate(transfer.date)}
            </p>
          </div>
        </div>
        <p className="flex-shrink-0 text-right font-semibold text-sm text-primary">{formatPeso(transfer.amount)}</p>
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
        transfers={transfers}
        categories={categories}
        onBack={() => setSelectedAccount(null)}
        onUpdateTransfer={onUpdateTransfer}
        onDeleteTransfer={onDeleteTransfer}
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
        <div className="flex items-center gap-2">
          <button onClick={() => setTransferring(true)} disabled={!canTransfer} className="h-11 w-11 rounded-2xl bg-card border border-border text-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40" aria-label="Transfer money">
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <button onClick={() => setAddingAccount(true)} disabled={!activeLedger} className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40" aria-label="Add an account">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {!activeLedger && <EmptyState title="No ledger selected" body="Add a ledger in Settings before adding accounts." />}
        {activeLedger && accounts.length === 0 && <EmptyState title="No accounts yet" body="Add an account to display balances and transactions." />}

        {accounts.map(account => {
          return (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className="w-full rounded-[22px] p-4 text-left text-white shadow-lg active:scale-[0.98] transition-all bg-gradient-to-br from-[#ec4899] via-[#f472b6] to-[#fbcfe8] dark:from-[#020617] dark:via-[#1e3a8a] dark:to-[#0f172a]"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold truncate">{account.name}</p>
                {account.qrImage ? (
                  <img src={account.qrImage} alt={`${account.name} QR code`} className="w-8 h-8 rounded-lg object-cover border border-white/50" />
                ) : (
                  <CreditCard className="w-6 h-6 text-white" />
                )}
              </div>
              <p className="text-sm font-semibold text-white/90 mb-1">Balance</p>
              <p className="text-2xl font-bold">{formatPeso(account.balance)}</p>
              <p className="text-sm font-semibold text-white/90 mt-3">
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

      <div className="mt-8">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Transfer History</h3>
        {transfers.length === 0 ? (
          <EmptyState title="No transfers yet" body="Use two accounts to move money and display transfer history." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {transfers.map((transfer, index) => renderTransfer(transfer, index < transfers.length - 1))}
          </div>
        )}
      </div>

      {addingAccount && <AddAccountModal onAdd={onAddAccount} onClose={() => setAddingAccount(false)} />}
      {transferring && <TransferMoneyModal accounts={accounts} onAdd={onAddTransfer} onClose={() => setTransferring(false)} />}

      {editingTransfer && (
        <TransferDetailsModal
          transfer={editingTransfer}
          accounts={accounts}
          onSave={transfer => onUpdateTransfer(editingTransfer.id, transfer)}
          onDelete={() => {
            onDeleteTransfer(editingTransfer.id);
            setEditingTransfer(null);
          }}
          onClose={() => setEditingTransfer(null)}
        />
      )}

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
