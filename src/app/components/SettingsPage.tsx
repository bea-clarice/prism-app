import { useEffect, useState } from 'react';
import { Check, ImagePlus, LogOut, Plus, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Account, Category, Ledger, Profile } from './types';

interface SettingsPageProps {
  profile: Profile;
  ledgers: Ledger[];
  accounts: Account[];
  categories: Category[];
  onUpdateProfile: (profile: Profile) => void;
  onAddLedger: (name: string) => void;
  onDeleteLedger: (id: string) => void;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onLogout: () => void;
}

const money = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_MARKS = ['$', '<>', 'F', 'T', 'H', 'B', 'U', 'S', 'M', 'G', 'R', 'L'];

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

  const initials = profile.name
    .split(' ')
    .map(part => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    if (name.trim()) {
      onUpdate({ ...profile, name: name.trim() });
      setEditing(false);
    }
  };

  return (
    <Section title="Profile">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {profile.photoUrl ? <img src={profile.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder="Full name"
                className="min-w-0 flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <button onClick={handleSave} className="bg-primary text-white rounded-xl px-3">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="bg-muted rounded-xl px-3">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{profile.name}</p>
                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                <p className="text-xs text-primary mt-1">Firebase Google email</p>
              </div>
              <button onClick={() => setEditing(true)} className="text-primary text-sm font-medium">
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function LedgerManager({
  ledgers,
  onAdd,
  onDelete,
}: {
  ledgers: Ledger[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Manage ledgers</p>
        <button onClick={() => setAdding(v => !v)} className="text-primary text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {adding && (
        <div className="flex gap-2 mb-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ledger name"
            autoFocus
            className="flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <button onClick={handleAdd} className="bg-primary text-white rounded-xl px-3">
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="space-y-1">
        {ledgers.map(ledger => (
          <div key={ledger.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="font-medium text-sm">{ledger.name}</span>
            <button onClick={() => onDelete(ledger.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {ledgers.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No ledgers yet</p>}
      </div>
    </Section>
  );
}

function AccountManager({
  accounts,
  onAdd,
  onDelete,
}: {
  accounts: Account[];
  onAdd: (account: Omit<Account, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
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
      number: form.kind === 'bank' ? form.number.trim() : form.number.trim() || undefined,
      qrImage: form.kind === 'bank' ? form.qrImage : undefined,
    });
    setForm({ kind: 'bank', name: '', balance: '', number: '', qrImage: '' });
    setAdding(false);
  };

  return (
    <Section title="Account Manager">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Bank or Cash</p>
        <button onClick={() => setAdding(v => !v)} className="text-primary text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['bank', 'cash'] as const).map(kind => (
              <button
                key={kind}
                onClick={() => setForm(f => ({ ...f, kind }))}
                className={`py-2 rounded-xl text-sm font-medium capitalize ${
                  form.kind === kind ? 'bg-primary text-white' : 'bg-card text-muted-foreground'
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Account name"
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            type="number"
            value={form.balance}
            onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
            placeholder="Balance"
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            value={form.number}
            onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
            placeholder={form.kind === 'bank' ? 'Account number' : 'Account number optional'}
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          {form.kind === 'bank' && (
            <label className="block bg-card rounded-xl p-3 cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={e => handleFileChange(e.target.files?.[0])}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <ImagePlus className="w-5 h-5 text-primary" />
                <span className="text-sm">Insert QR image optional</span>
              </div>
              {form.qrImage && (
                <img src={form.qrImage} alt="QR preview" className="mt-3 w-20 h-20 rounded-xl object-cover border border-border" />
              )}
            </label>
          )}
          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl py-2 text-sm font-medium">
            Add Account
          </button>
        </div>
      )}

      <div className="space-y-1">
        {accounts.map(account => (
          <div key={account.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {account.kind} - {money(account.balance)}{account.number ? ` - ${account.number}` : ''}
              </p>
            </div>
            <button onClick={() => onDelete(account.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No accounts yet</p>}
      </div>
    </Section>
  );
}

function CategoryManager({
  categories,
  onAdd,
  onDelete,
}: {
  categories: Category[];
  onAdd: (category: Omit<Category, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as Category['type'],
    emoji: CATEGORY_MARKS[0],
    color: '#ec4899',
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd({
      ...form,
      name: form.name.trim(),
      color: form.type === 'income' ? '#16a34a' : '#e11d48',
    });
    setForm({ name: '', type: 'expense', emoji: CATEGORY_MARKS[0], color: '#ec4899' });
    setAdding(false);
  };

  const displayed = categories.filter(category => category.type === activeTab);
  const incomeCount = categories.filter(category => category.type === 'income').length;
  const expenseCount = categories.filter(category => category.type === 'expense').length;

  return (
    <Section title="Category Manager">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-2 rounded-xl text-sm ${activeTab === 'income' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            Income ({incomeCount})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-2 rounded-xl text-sm ${activeTab === 'expense' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            Expense ({expenseCount})
          </button>
        </div>
        <button onClick={() => setAdding(v => !v)} className="text-primary text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['income', 'expense'] as const).map(type => (
              <button
                key={type}
                onClick={() => setForm(f => ({ ...f, type }))}
                className={`py-2 rounded-xl text-sm font-medium capitalize ${
                  form.type === type ? 'bg-primary text-white' : 'bg-card text-muted-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Category name"
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_MARKS.map(mark => (
              <button
                key={mark}
                onClick={() => setForm(f => ({ ...f, emoji: mark }))}
                className={`h-9 rounded-xl text-sm font-semibold ${
                  form.emoji === mark ? 'bg-primary text-white' : 'bg-card text-muted-foreground'
                }`}
              >
                {mark}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} className="w-full bg-primary text-white rounded-xl py-2 text-sm font-medium">
            Add Category
          </button>
        </div>
      )}

      <div className="space-y-1">
        {displayed.map(category => (
          <div key={category.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {category.emoji}
              </span>
              <span className="font-medium text-sm">{category.name}</span>
            </div>
            <button onClick={() => onDelete(category.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {displayed.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No {activeTab} categories yet</p>}
      </div>
    </Section>
  );
}

export function SettingsPage({
  profile,
  ledgers,
  accounts,
  categories,
  onUpdateProfile,
  onAddLedger,
  onDeleteLedger,
  onAddAccount,
  onDeleteAccount,
  onAddCategory,
  onDeleteCategory,
  onLogout,
}: SettingsPageProps) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggles = [
    { label: 'Notifications', value: notifications, set: setNotifications },
    { label: 'Dark Mode', value: darkMode, set: setDarkMode },
  ];

  return (
    <div className="p-6 max-w-md mx-auto pb-10">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      <ProfileSection profile={profile} onUpdate={onUpdateProfile} />
      <LedgerManager ledgers={ledgers} onAdd={onAddLedger} onDelete={onDeleteLedger} />
      <AccountManager accounts={accounts} onAdd={onAddAccount} onDelete={onDeleteAccount} />
      <CategoryManager categories={categories} onAdd={onAddCategory} onDelete={onDeleteCategory} />

      <Section title="Preferences">
        <div className="space-y-1">
          {toggles.map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span>{label}</span>
              <button
                onClick={() => set(value => !value)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${value ? 'bg-primary' : 'bg-muted'}`}
                aria-label={label}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${value ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <button
        onClick={onLogout}
        className="w-full bg-card border border-border rounded-3xl p-4 text-destructive font-semibold flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
