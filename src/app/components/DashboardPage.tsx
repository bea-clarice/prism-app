import { useMemo, useState } from 'react';
import { ArrowUpRight, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from './category-icons/CategoryIcon';
import type { Account, Category, CategoryIconKey, Ledger, Transaction } from './types';
import { formatPeso } from '../utils/format';

interface AddTransactionModalProps {
  category: Category;
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onClose: () => void;
}

interface AddCategoryModalProps {
  type: 'income' | 'expense';
  onAdd: (c: Omit<Category, 'id' | 'ledgerId'>) => void;
  onClose: () => void;
}

interface DashboardPageProps {
  activeLedger: Ledger | null;
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'ledgerId'>) => void;
  onAddCategory: (c: Omit<Category, 'id' | 'ledgerId'>) => void;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 text-center border border-dashed border-border">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  );
}

function AddTransactionModal({ category, accounts, onAdd, onClose }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [showPaymentItems, setShowPaymentItems] = useState(false);
  const [paymentItems, setPaymentItems] = useState<{ label: string; amount: string }[]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleSubmit = () => {
    const parsed = showPaymentItems && paymentItems.length > 0 ? itemizedTotal : parseFloat(amount);
    if (!parsed || !accountId) return;
    onAdd({
      description: description.trim() || category.name,
      amount: parsed,
      type: category.type,
      categoryId: category.id,
      accountId,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CategoryIcon icon={category.icon} />
            </span>
            <div>
              <h3 className="font-semibold">Add Transaction</h3>
              <p className="text-sm text-muted-foreground capitalize">{category.type} - {category.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!showPaymentItems && (
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          )}
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description optional" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <div className="rounded-2xl bg-muted p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Add payments together</p>
                <p className="text-xs text-muted-foreground">Optional itemized total for one transaction.</p>
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
                    <input value={item.label} onChange={e => updatePaymentItem(index, 'label', e.target.value)} placeholder="Vehicle" className="min-w-0 bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                    <input type="number" min="0" step="0.01" value={item.amount} onChange={e => updatePaymentItem(index, 'amount', e.target.value)} placeholder="0.00" className="bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
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
          <div>
            <p className="text-sm text-muted-foreground mb-2">Account</p>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setAccountId(account.id)}
                  className={`rounded-xl p-3 text-left border ${
                    accountId === account.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.kind}</p>
                </button>
              ))}
            </div>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <button onClick={handleSubmit} className="w-full bg-primary text-white rounded-xl p-4 font-semibold hover:opacity-90 transition-opacity">
            Add {category.type === 'income' ? 'Income' : 'Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ type, onAdd, onClose }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<CategoryIconKey>('wallet');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, icon, color: type === 'income' ? '#16a34a' : '#e11d48' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold capitalize">Add {type} Category</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" autoFocus className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Category icon</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_ICON_OPTIONS.map(option => (
                <button key={option.key} onClick={() => setIcon(option.key)} className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs ${icon === option.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted'}`}>
                  <CategoryIcon icon={option.key} className="w-5 h-5" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-primary text-white rounded-xl p-3 font-semibold">Add Category</button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({ activeLedger, categories, transactions, accounts, onAddTransaction, onAddCategory }: DashboardPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addingCategoryType, setAddingCategoryType] = useState<'income' | 'expense' | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netChange = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    transactions.forEach(t => {
      const day = t.date.slice(8, 10);
      byDay.set(day, (byDay.get(day) || 0) + (t.type === 'income' ? t.amount : -t.amount));
    });
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = String(date.getDate()).padStart(2, '0');
      return { name: date.toLocaleDateString('en-US', { weekday: 'short' }), value: byDay.get(key) || 0 };
    });
  }, [transactions]);

  const categoryTotals = categories.map(category => ({
    ...category,
    total: monthTransactions.filter(t => t.categoryId === category.id).reduce((sum, t) => sum + t.amount, 0),
  }));
  const incomeCategories = categoryTotals.filter(category => category.type === 'income');
  const expenseCategories = categoryTotals.filter(category => category.type === 'expense');
  const canAddTransaction = accounts.length > 0;

  const renderCategorySection = (type: 'income' | 'expense', title: string, color: string, items: typeof incomeCategories) => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold" style={{ color }}>{title}</h3>
        <button onClick={() => setAddingCategoryType(type)} disabled={!activeLedger} className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-sm disabled:opacity-40" aria-label={`Add ${type} category`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(category => (
          <button key={category.id} onClick={() => canAddTransaction && setSelectedCategory(category)} className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center hover:border-primary/50 active:scale-95 transition-all disabled:opacity-60">
            <span className="w-11 h-11 mb-3 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CategoryIcon icon={category.icon} />
            </span>
            <p className="text-sm font-medium text-foreground truncate">{category.name}</p>
            <p className="text-sm font-semibold" style={{ color }}>{type === 'income' ? '+' : '-'}{formatPeso(category.total)}</p>
          </button>
        ))}
        {items.length === 0 && (
          <button onClick={() => setAddingCategoryType(type)} disabled={!activeLedger} className="col-span-2 bg-card rounded-2xl p-5 border border-dashed border-border text-muted-foreground text-sm disabled:opacity-50">
            Add a {type} category to display data
          </button>
        )}
      </div>
      {items.length > 0 && !canAddTransaction && (
        <p className="text-xs text-muted-foreground text-center mt-2">Add an account before adding transactions.</p>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6 text-center bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-primary via-green-500 to-amber-400 rounded-full" />
        <p className="text-muted-foreground">Balance Overview</p>
        <h1 className="text-4xl font-bold text-foreground mt-2">{formatPeso(totalBalance)}</h1>
        <p className="text-xs text-muted-foreground mt-2">{activeLedger ? activeLedger.name : 'Add a ledger to begin'}</p>
      </div>

      {!activeLedger && <EmptyState title="No ledger yet" body="Add a ledger in Settings to create your first financial space." />}

      <div className="bg-card rounded-3xl p-6 my-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground">This Week</p>
            <p className="text-2xl font-semibold">{formatPeso(netChange)}</p>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">Net</span>
          </div>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" body="Add accounts, categories, and transactions to display graph data." />
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip formatter={(value: number) => formatPeso(value)} />
              <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{ r: 3, fill: '#ec4899' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2 text-green-600"><TrendingUp className="w-5 h-5" /><p className="text-sm">Monthly Income</p></div>
          <p className="text-xl font-semibold">{formatPeso(totalIncome)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2 text-rose-600"><TrendingDown className="w-5 h-5" /><p className="text-sm">Monthly Expenses</p></div>
          <p className="text-xl font-semibold">{formatPeso(totalExpense)}</p>
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total income</span><span className="font-semibold text-green-600">{formatPeso(totalIncome)}</span></div>
        <div className="flex items-center justify-between text-sm mt-2"><span className="text-muted-foreground">Total expenses</span><span className="font-semibold text-rose-600">{formatPeso(totalExpense)}</span></div>
      </div>

      {renderCategorySection('income', 'Income Categories', '#16a34a', incomeCategories)}
      {renderCategorySection('expense', 'Expense Categories', '#e11d48', expenseCategories)}

      {selectedCategory && <AddTransactionModal category={selectedCategory} accounts={accounts} onAdd={onAddTransaction} onClose={() => setSelectedCategory(null)} />}
      {addingCategoryType && <AddCategoryModal type={addingCategoryType} onAdd={onAddCategory} onClose={() => setAddingCategoryType(null)} />}
    </div>
  );
}
