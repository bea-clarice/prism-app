import { useMemo, useState } from 'react';
import { CalendarClock, Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import type { Bill, Ledger } from './types';
import { formatPeso } from '../utils/format';

interface BillsPageProps {
  activeLedger: Ledger | null;
  bills: Bill[];
  onAddBill: (bill: Omit<Bill, 'id' | 'paid' | 'ledgerId'>) => void;
  onTogglePaid: (id: string) => void;
  onDeleteBill: (id: string) => void;
}

const today = new Date().toISOString().split('T')[0];

const recurringOptions: { value: Bill['recurring']; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Biannually' },
  { value: 'annually', label: 'Annually' },
  { value: 'manual', label: 'Manual (once only)' },
];

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border">
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm mt-1">{body}</p>
    </div>
  );
}

function getBillStatus(bill: Bill) {
  if (bill.paid) return { label: 'Paid', className: 'bg-green-50 text-green-700 border-green-100' };
  if (bill.dueDate < today) return { label: 'Overdue', className: 'bg-rose-50 text-rose-700 border-rose-100' };
  return { label: 'Unpaid', className: 'bg-amber-50 text-amber-700 border-amber-100' };
}

export function BillsPage({ activeLedger, bills, onAddBill, onTogglePaid, onDeleteBill }: BillsPageProps) {
  const [adding, setAdding] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: today,
    recurring: 'manual' as Bill['recurring'],
  });

  const summary = useMemo(() => {
    const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paidBills = bills.filter(bill => bill.paid).reduce((sum, bill) => sum + bill.amount, 0);
    const unpaidBills = bills.filter(bill => !bill.paid).reduce((sum, bill) => sum + bill.amount, 0);
    const overdueBills = bills.filter(bill => !bill.paid && bill.dueDate < today).reduce((sum, bill) => sum + bill.amount, 0);
    return { totalBills, paidBills, unpaidBills, overdueBills };
  }, [bills]);

  const handleAdd = () => {
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || !amount || !form.dueDate) return;
    onAddBill({ name: form.name.trim(), amount, dueDate: form.dueDate, recurring: form.recurring });
    setForm({ name: '', amount: '', dueDate: today, recurring: 'manual' });
    setAdding(false);
  };

  const recurringLabel = recurringOptions.find(option => option.value === form.recurring)?.label || 'Manual (once only)';

  return (
    <div className="p-6 max-w-md mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Monthly bills</p>
          <h2 className="text-3xl font-bold">Bills</h2>
        </div>
        <button onClick={() => setAdding(true)} disabled={!activeLedger} className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40" aria-label="Add bill">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border"><p className="text-xs text-muted-foreground">Total Bills</p><p className="text-xl font-semibold">{formatPeso(summary.totalBills)}</p></div>
        <div className="bg-card rounded-2xl p-4 border border-border"><p className="text-xs text-muted-foreground">Paid Bills</p><p className="text-xl font-semibold text-green-600">{formatPeso(summary.paidBills)}</p></div>
        <div className="bg-card rounded-2xl p-4 border border-border"><p className="text-xs text-muted-foreground">Unpaid Bills</p><p className="text-xl font-semibold text-amber-600">{formatPeso(summary.unpaidBills)}</p></div>
        <div className="bg-card rounded-2xl p-4 border border-border"><p className="text-xs text-muted-foreground">Overdue Bills</p><p className="text-xl font-semibold text-rose-600">{formatPeso(summary.overdueBills)}</p></div>
      </div>

      {!activeLedger && <EmptyState title="No ledger selected" body="Add a ledger in Settings before adding bills." />}

      {adding && (
        <div className="bg-card rounded-3xl p-5 border border-border shadow-sm mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Add Bill</h3>
            <button onClick={() => setAdding(false)} className="p-2 rounded-full bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bill name" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-muted rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-foreground" />

          <div className="relative">
            <button onClick={() => setRecurringOpen(open => !open)} className="w-full flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
              <span>{recurringLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {recurringOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-lg p-2 z-10">
                {recurringOptions.map(option => (
                  <button key={option.value} onClick={() => { setForm(f => ({ ...f, recurring: option.value })); setRecurringOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm ${form.recurring === option.value ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl p-3 font-semibold">Add Bill</button>
        </div>
      )}

      <div className="space-y-3">
        {activeLedger && bills.length === 0 && <EmptyState title="No bills yet" body="Add bills to display your monthly summary." />}
        {bills.map(bill => {
          const status = getBillStatus(bill);
          const recurring = recurringOptions.find(option => option.value === bill.recurring)?.label;
          return (
            <div key={bill.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1"><CalendarClock className="w-4 h-4 text-primary flex-shrink-0" /><p className="font-semibold truncate">{bill.name}</p></div>
                  <p className="text-sm text-muted-foreground">Due {new Date(`${bill.dueDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {recurring}</p>
                </div>
                <p className="font-semibold">{formatPeso(bill.amount)}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className={`text-xs px-3 py-1 rounded-full border ${status.className}`}>{status.label}</span>
                <div className="flex items-center gap-2">
                  {!bill.paid && (
                    <button onClick={() => onTogglePaid(bill.id)} className="h-9 w-9 rounded-xl flex items-center justify-center bg-muted text-muted-foreground" aria-label="Mark paid"><Check className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => onDeleteBill(bill.id)} className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center" aria-label="Delete bill"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
