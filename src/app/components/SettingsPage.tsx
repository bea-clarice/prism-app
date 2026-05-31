import { useState } from 'react';
import { Check, ImagePlus, LogOut, Plus, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from './category-icons/CategoryIcon';
import type { Account, Category, CategoryIconKey, Ledger, Profile } from './types';
import { formatPeso } from '../utils/format';

interface SettingsPageProps {
  profile: Profile;
  ledgers: Ledger[];
  activeLedgerId: string | null;
  accounts: Account[];
  categories: Category[];
  onSelectLedger: (id: string) => void;
  onUpdateProfile: (profile: Profile) => void;
  onAddLedger: (name: string) => void;
  onDeleteLedger: (id: string) => void;
  onAddAccount: (account: Omit<Account, 'id' | 'ledgerId'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'ledgerId'>) => void;
  onDeleteCategory: (id: string) => void;
  notificationsEnabled: boolean;
  onSetNotificationsEnabled: (value: boolean) => void;
  darkMode: boolean;
  onSetDarkMode: (value: boolean) => void;
  onLogout: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ProfileSection({ profile, onUpdate }: { profile: Profile; onUpdate: (profile: Profile) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);

  const initials = profile.name.split(' ').map(part => part[0] || '').join('').slice(0, 2).toUpperCase();

  const handleSave = () => {
    if (!name.trim()) return;
    onUpdate({ ...profile, name: name.trim() });
    setEditing(false);
  };

  return (
    <Section title="Profile">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
          {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" /> : initials}
        </div>
        {editing ? (
          <div className="w-full flex gap-2 mt-4">
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Full name" className="min-w-0 flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
            <button onClick={handleSave} className="bg-primary text-white rounded-xl px-3"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="bg-muted rounded-xl px-3"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <p className="font-semibold mt-4">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <button onClick={() => setEditing(true)} className="text-primary text-sm font-medium mt-3">Edit</button>
          </>
        )}
      </div>
    </Section>
  );
}

function LedgerManager({ ledgers, activeLedgerId, onSelect, onAdd, onDelete }: { ledgers: Ledger[]; activeLedgerId: string | null; onSelect: (id: string) => void; onAdd: (name: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
  };

  return (
    <Section title="Ledger Manager">
      <p className="text-sm text-muted-foreground mb-4">Each ledger is a separate financial space. Switching ledgers shows only that ledger's accounts, categories, transactions, and bills.</p>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Ledgers</p>
        <button onClick={() => setAdding(value => !value)} className="text-primary text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {adding && (
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Ledger name" autoFocus className="flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <button onClick={handleAdd} className="bg-primary text-white rounded-xl px-3"><Check className="w-4 h-4" /></button>
        </div>
      )}
      <div className="space-y-2">
        {ledgers.map(ledger => (
          <div key={ledger.id} className={`flex items-center justify-between p-3 rounded-2xl border ${activeLedgerId === ledger.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'}`}>
            <button onClick={() => onSelect(ledger.id)} className="text-left flex-1">
              <p className="font-medium text-sm">{ledger.name}</p>
              <p className="text-xs text-muted-foreground">{activeLedgerId === ledger.id ? 'Current ledger' : 'Switch to this ledger'}</p>
            </button>
            <button onClick={() => onDelete(ledger.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {ledgers.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No ledgers yet. Add one to begin.</p>}
      </div>
    </Section>
  );
}

function AccountManager({ accounts, canAdd, onAdd, onDelete }: { accounts: Account[]; canAdd: boolean; onAdd: (account: Omit<Account, 'id' | 'ledgerId'>) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ kind: 'bank' as Account['kind'], name: '', balance: '', number: '', qrImage: '' });

  const handleFileChange = (file?: File) => {
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, qrImage: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    const balance = parseFloat(form.balance);
    if (!form.name.trim() || isNaN(balance)) return;
    onAdd({ kind: form.kind, name: form.name.trim(), balance, number: form.kind === 'bank' ? form.number.trim() : undefined, qrImage: form.kind === 'bank' ? form.qrImage : undefined });
    setForm({ kind: 'bank', name: '', balance: '', number: '', qrImage: '' });
    setAdding(false);
  };

  return (
    <Section title="Account Manager">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Bank or Cash</p>
        <button disabled={!canAdd} onClick={() => setAdding(value => !value)} className="text-primary text-sm font-medium flex items-center gap-1 disabled:opacity-40"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {!canAdd && <p className="text-muted-foreground text-sm text-center py-3">Add a ledger first.</p>}

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['bank', 'cash'] as const).map(kind => <button key={kind} onClick={() => setForm(f => ({ ...f, kind }))} className={`py-2 rounded-xl text-sm font-medium capitalize ${form.kind === kind ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}>{kind}</button>)}
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Account name" className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="Balance" className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
          {form.kind === 'bank' && (
            <>
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Account number" className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
              <label className="block bg-card rounded-xl p-3 cursor-pointer">
                <input type="file" accept="image/png,image/jpeg" onChange={e => handleFileChange(e.target.files?.[0])} className="hidden" />
                <div className="flex items-center gap-3"><ImagePlus className="w-5 h-5 text-primary" /><span className="text-sm">Insert QR image optional</span></div>
                {form.qrImage && <img src={form.qrImage} alt="QR preview" className="mt-3 w-20 h-20 rounded-xl object-cover border border-border" />}
              </label>
            </>
          )}
          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl py-2 text-sm font-medium">Add Account</button>
        </div>
      )}

      <div className="space-y-1">
        {accounts.map(account => (
          <div key={account.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{account.kind} - {formatPeso(account.balance)}{account.number ? ` - ${account.number}` : ''}</p>
            </div>
            <button onClick={() => onDelete(account.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {canAdd && accounts.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No accounts yet. Add account details to display data.</p>}
      </div>
    </Section>
  );
}

function CategoryManager({ categories, canAdd, onAdd, onDelete }: { categories: Category[]; canAdd: boolean; onAdd: (category: Omit<Category, 'id' | 'ledgerId'>) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [form, setForm] = useState({ name: '', icon: 'wallet' as CategoryIconKey });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd({
      name: form.name.trim(),
      type: activeTab,
      icon: form.icon,
      color: activeTab === 'income' ? '#16a34a' : '#e11d48',
    });
    setForm({ name: '', icon: 'wallet' });
    setAdding(false);
  };

  const displayed = categories.filter(category => category.type === activeTab);

  return (
    <Section title="Category Manager">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('income')} className={`px-3 py-2 rounded-xl text-sm ${activeTab === 'income' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>Income</button>
          <button onClick={() => setActiveTab('expense')} className={`px-3 py-2 rounded-xl text-sm ${activeTab === 'expense' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>Expense</button>
        </div>
        <button disabled={!canAdd} onClick={() => setAdding(value => !value)} className="text-primary text-sm font-medium flex items-center gap-1 disabled:opacity-40"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {!canAdd && <p className="text-muted-foreground text-sm text-center py-3">Add a ledger first.</p>}

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-xs text-muted-foreground">Adding to {activeTab}</p>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_ICON_OPTIONS.map(option => (
              <button key={option.key} onClick={() => setForm(f => ({ ...f, icon: option.key }))} className={`h-14 rounded-xl text-xs flex flex-col items-center justify-center gap-1 ${form.icon === option.key ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}>
                <CategoryIcon icon={option.key} className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl py-2 text-sm font-medium">Add {activeTab} Category</button>
        </div>
      )}

      <div className="space-y-1">
        {displayed.map(category => (
          <div key={category.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><CategoryIcon icon={category.icon} className="w-4 h-4" /></span>
              <span className="font-medium text-sm">{category.name}</span>
            </div>
            <button onClick={() => onDelete(category.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {canAdd && displayed.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No {activeTab} categories yet. Add details to display data.</p>}
      </div>
    </Section>
  );
}

export function SettingsPage({ profile, ledgers, activeLedgerId, accounts, categories, onSelectLedger, onUpdateProfile, onAddLedger, onDeleteLedger, onAddAccount, onDeleteAccount, onAddCategory, onDeleteCategory, notificationsEnabled, onSetNotificationsEnabled, darkMode, onSetDarkMode, onLogout }: SettingsPageProps) {
  const toggles = [
    { label: 'Notifications', value: notificationsEnabled, set: onSetNotificationsEnabled },
    { label: 'Dark Mode', value: darkMode, set: onSetDarkMode },
  ];

  return (
    <div className="p-6 max-w-md mx-auto pb-10">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      <ProfileSection profile={profile} onUpdate={onUpdateProfile} />
      <LedgerManager ledgers={ledgers} activeLedgerId={activeLedgerId} onSelect={onSelectLedger} onAdd={onAddLedger} onDelete={onDeleteLedger} />
      <AccountManager accounts={accounts} canAdd={Boolean(activeLedgerId)} onAdd={onAddAccount} onDelete={onDeleteAccount} />
      <CategoryManager categories={categories} canAdd={Boolean(activeLedgerId)} onAdd={onAddCategory} onDelete={onDeleteCategory} />

      <Section title="Preferences">
        <div className="space-y-1">
          {toggles.map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span>{label}</span>
              <button onClick={() => set(!value)} className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${value ? 'bg-primary' : 'bg-muted'}`} aria-label={label}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${value ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <button onClick={onLogout} className="w-full bg-card border border-border rounded-3xl p-4 text-destructive font-semibold flex items-center justify-center gap-2">
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
