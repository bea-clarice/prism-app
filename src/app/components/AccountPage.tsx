import { useState } from 'react';
import { CreditCard, ChevronLeft } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Account, Transaction, Category } from './types';

interface AccountDetailViewProps {
  account: Account;
  transactions: Transaction[];
  categories: Category[];
  onBack: () => void;
}

function AccountDetailView({ account, transactions, categories, onBack }: AccountDetailViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : new Date().toISOString().split('T')[0];

  const dayTransactions = transactions.filter(
    t => t.accountId === account.id && t.date === selectedDateStr
  );

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="p-6 pb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary mb-4 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">My Accounts</span>
        </button>
        <h2 className="text-2xl font-bold">{account.name}</h2>
        <p className="text-muted-foreground text-sm">{account.number}</p>
        <p className="text-3xl font-bold text-primary mt-2">
          ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Calendar */}
      <div className="px-6 mb-4">
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <style>{`
            .rdp-custom .rdp-day_selected:not(.rdp-day_disabled) {
              background-color: #ec4899 !important;
              color: white !important;
              border-radius: 50% !important;
            }
            .rdp-custom .rdp-day_today {
              color: #ec4899 !important;
              font-weight: bold;
            }
            .rdp-custom .rdp-caption_label {
              color: #ec4899;
            }
            .rdp-custom .rdp-nav_button:hover {
              background-color: #fce7f3;
            }
            .rdp-custom {
              margin: 0;
              padding: 16px;
              width: 100%;
            }
            .rdp-custom .rdp-table {
              width: 100%;
            }
            .rdp-custom .rdp-head_cell {
              color: #ec4899;
              font-size: 0.8rem;
            }
            .rdp-custom .rdp-day:hover:not(.rdp-day_selected) {
              background-color: #fce7f3;
              border-radius: 50%;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rdp-custom"
          />
        </div>
      </div>

      {/* Day Summary */}
      {dayTransactions.length > 0 && (
        <div className="px-6 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
              <p className="text-xs text-green-600 mb-1">Day Income</p>
              <p className="font-semibold text-green-700">+${dayIncome.toFixed(2)}</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100">
              <p className="text-xs text-rose-600 mb-1">Day Expense</p>
              <p className="font-semibold text-rose-700">-${dayExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions for selected date */}
      <div className="px-6 pb-8">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) || 'Today'}
        </h3>
        {dayTransactions.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-muted-foreground text-sm">No transactions on this day</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {dayTransactions.map((t, i) => {
              const cat = getCategoryById(t.categoryId);
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-4 ${
                    i < dayTransactions.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                      {cat?.emoji || '💰'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{cat?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface AccountPageProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export function AccountPage({ accounts, transactions, categories }: AccountPageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  if (selectedAccount) {
    const current = accounts.find(a => a.id === selectedAccount.id) || selectedAccount;
    return (
      <AccountDetailView
        account={current}
        transactions={transactions}
        categories={categories}
        onBack={() => setSelectedAccount(null)}
      />
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6">My Accounts</h2>
      <p className="text-sm text-muted-foreground mb-4">Tap an account to view transaction history</p>

      <div className="space-y-4">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => setSelectedAccount(account)}
            className="w-full bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 text-white shadow-lg text-left hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm opacity-90">{account.name}</p>
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="mb-4">
              <p className="text-sm opacity-90 mb-1">Balance</p>
              <p className="text-3xl font-bold">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-sm opacity-90">{account.number}</p>
          </button>
        ))}

        {accounts.length === 0 && (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-muted-foreground text-sm">No accounts yet. Add one in Settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
