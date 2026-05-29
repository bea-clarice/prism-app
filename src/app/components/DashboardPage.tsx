import { useMemo, useState } from 'react';
import { ArrowUpRight, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Account, Category, Transaction } from './types';

interface AddTransactionModalProps {
  category: Category;
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

interface AddCategoryModalProps {
  type: 'income' | 'expense';
  onAdd: (c: Omit<Category, 'id'>) => void;
  onClose: () => void;
}

interface DashboardPageProps {
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
}

const money = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_MARKS = ['$', '<>', 'F', 'T', 'H', 'B', 'U', 'S', 'M', 'G', 'R', 'L'];

function AddTransactionModal({ category, accounts, onAdd, onClose }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
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
      <div
        className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {category.emoji}
            </span>
            <div>
              <h3 className="font-semibold">Add Transaction</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {category.type} - {category.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description optional</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={category.name}
              className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Account</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-primary text-white rounded-xl p-4 font-semibold hover:opacity-90 transition-opacity"
          >
            Add {category.type === 'income' ? 'Income' : 'Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ type, onAdd, onClose }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CATEGORY_MARKS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      type,
      emoji,
      color: type === 'income' ? '#16a34a' : '#e11d48',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold capitalize">Add {type} Category</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Category name"
            autoFocus
            className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Category mark</p>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_MARKS.map(mark => (
                <button
                  key={mark}
                  onClick={() => setEmoji(mark)}
                  className={`h-10 rounded-xl border flex items-center justify-center font-semibold ${
                    emoji === mark ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted'
                  }`}
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-primary text-white rounded-xl p-3 font-semibold">
            Add Category
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({
  categories,
  transactions,
  accounts,
  onAddTransaction,
  onAddCategory,
}: DashboardPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addingCategoryType, setAddingCategoryType] = useState<'income' | 'expense' | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netChange = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    monthTransactions.forEach(t => {
      const day = t.date.slice(8, 10);
      const delta = t.type === 'income' ? t.amount : -t.amount;
      byDay.set(day, (byDay.get(day) || 0) + delta);
    });

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (5 - index));
      const key = String(date.getDate()).padStart(2, '0');
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: byDay.get(key) || 0,
      };
    });
  }, [monthTransactions]);

  const categoryTotals = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      total: monthTransactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [categories, monthTransactions]);

  const incomeCategories = categoryTotals.filter(c => c.type === 'income');
  const expenseCategories = categoryTotals.filter(c => c.type === 'expense');

  const renderCategorySection = (type: 'income' | 'expense', title: string, color: string, items: typeof incomeCategories) => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold" style={{ color }}>{title}</h3>
        <button
          onClick={() => setAddingCategoryType(type)}
          className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-sm"
          aria-label={`Add ${type} category`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:border-primary/50 active:scale-95 transition-all"
          >
            <span className="w-10 h-10 mb-3 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {cat.emoji}
            </span>
            <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
            <p className="text-sm font-semibold" style={{ color }}>
              {type === 'income' ? '+' : '-'}{money(cat.total)}
            </p>
          </button>
        ))}
        {items.length === 0 && (
          <button
            onClick={() => setAddingCategoryType(type)}
            className="col-span-2 bg-card rounded-2xl p-5 border border-dashed border-border text-muted-foreground text-sm"
          >
            Add your first {type} category
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <p className="text-muted-foreground">Balance Overview</p>
        <h1 className="text-4xl font-bold text-foreground mt-1">
          {money(totalBalance)}
        </h1>
      </div>

      <div className="bg-card rounded-3xl p-6 mb-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground">Line Graph</p>
            <p className="text-2xl font-semibold">{money(netChange)}</p>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">Monthly net</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip formatter={(value: number) => money(value)} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ r: 3, fill: '#ec4899' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm">Monthly Income</p>
          </div>
          <p className="text-2xl font-semibold">{money(totalIncome)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <TrendingDown className="w-5 h-5" />
            <p className="text-sm">Monthly Expenses</p>
          </div>
          <p className="text-2xl font-semibold">{money(totalExpense)}</p>
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total income</span>
          <span className="font-semibold text-green-600">{money(totalIncome)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Total expenses</span>
          <span className="font-semibold text-rose-600">{money(totalExpense)}</span>
        </div>
      </div>

      {renderCategorySection('income', 'Income Categories', '#16a34a', incomeCategories)}
      {renderCategorySection('expense', 'Expense Categories', '#e11d48', expenseCategories)}

      {selectedCategory && (
        <AddTransactionModal
          category={selectedCategory}
          accounts={accounts}
          onAdd={onAddTransaction}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {addingCategoryType && (
        <AddCategoryModal
          type={addingCategoryType}
          onAdd={onAddCategory}
          onClose={() => setAddingCategoryType(null)}
        />
      )}
    </div>
  );
}
