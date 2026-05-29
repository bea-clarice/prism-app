import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, X } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { Category, Transaction, Account } from './types';

interface AddTransactionModalProps {
  category: Category;
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

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
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.emoji}</span>
            <div>
              <h3 className="font-semibold">Add Transaction</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {category.type} · {category.name}
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
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
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

interface DashboardPageProps {
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const chartData = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 1398 },
  { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 3908 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 3800 },
  { name: 'Sun', value: 4300 },
];

export function DashboardPage({ categories, transactions, accounts, onAddTransaction }: DashboardPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      total: transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [categories, transactions]);

  const incomeCategories = categoryTotals.filter(c => c.type === 'income');
  const expenseCategories = categoryTotals.filter(c => c.type === 'expense');

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted-foreground">Total Balance</p>
        <h1 className="text-4xl font-bold text-foreground mt-1">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h1>
      </div>

      {/* Chart Card */}
      <div className="bg-card rounded-3xl p-6 mb-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground">This Week</p>
            <p className="text-2xl font-semibold">$4,567.89</p>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">+12.5%</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm opacity-90">Income</p>
          </div>
          <p className="text-2xl font-semibold">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gradient-to-br from-secondary/90 to-[#d946ef] rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5" />
            <p className="text-sm opacity-90">Expenses</p>
          </div>
          <p className="text-2xl font-semibold">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Income Categories */}
      {incomeCategories.length > 0 && (
        <div className="mb-5">
          <h3 className="font-semibold mb-3" style={{ color: '#16a34a' }}>Income Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {incomeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:border-primary/50 active:scale-95 transition-all"
              >
                <span className="text-2xl mb-2 block">{cat.emoji}</span>
                <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                  +${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expense Categories */}
      {expenseCategories.length > 0 && (
        <div className="mb-5">
          <h3 className="font-semibold mb-3" style={{ color: '#e11d48' }}>Expense Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {expenseCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:border-primary/50 active:scale-95 transition-all"
              >
                <span className="text-2xl mb-2 block">{cat.emoji}</span>
                <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                <p className="text-sm font-semibold" style={{ color: '#e11d48' }}>
                  -${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-muted-foreground text-sm">No categories yet. Add some in Settings.</p>
        </div>
      )}

      {/* Add Transaction Modal */}
      {selectedCategory && (
        <AddTransactionModal
          category={selectedCategory}
          accounts={accounts}
          onAdd={onAddTransaction}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
