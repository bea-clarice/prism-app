import { useState } from 'react';
import { Plus, Trash2, ChevronRight, Check, X } from 'lucide-react';
import type { Profile, Ledger, Account, Category } from './types';

interface SettingsPageProps {
  profile: Profile;
  ledgers: Ledger[];
  accounts: Account[];
  categories: Category[];
  onUpdateProfile: (p: Profile) => void;
  onAddLedger: (name: string) => void;
  onDeleteLedger: (id: string) => void;
  onAddAccount: (a: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

/* ─── Profile ─────────────────────────────────────────────────── */
function ProfileSection({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const initials = profile.name
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    if (name.trim()) {
      onUpdate({ name: name.trim(), email: email.trim() });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setName(profile.name);
    setEmail(profile.email);
    setEditing(false);
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Profile</h3>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleSave} className="text-primary text-sm font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={handleCancel} className="text-muted-foreground text-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-primary text-sm font-medium">Edit</button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        {editing ? (
          <div className="flex-1 space-y-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
              className="w-full bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
        ) : (
          <div>
            <p className="font-semibold">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Ledger Manager ──────────────────────────────────────────── */
function LedgerManager({
  ledgers, onAdd, onDelete
}: { ledgers: Ledger[]; onAdd: (n: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) { onAdd(name.trim()); setName(''); setAdding(false); }
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ledger Manager</h3>
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
          <button onClick={() => { setAdding(false); setName(''); }} className="bg-muted rounded-xl px-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-1">
        {ledgers.map(l => (
          <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">📒</span>
              <span className="font-medium text-sm">{l.name}</span>
            </div>
            <button onClick={() => onDelete(l.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {ledgers.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-3">No ledgers yet</p>
        )}
      </div>
    </div>
  );
}

/* ─── Account Manager ─────────────────────────────────────────── */
function AccountManager({
  accounts, onAdd, onDelete
}: { accounts: Account[]; onAdd: (a: Omit<Account, 'id'>) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', balance: '', number: '' });

  const handleAdd = () => {
    const bal = parseFloat(form.balance);
    if (form.name.trim() && !isNaN(bal)) {
      onAdd({ name: form.name.trim(), balance: bal, number: form.number.trim() || '****0000' });
      setForm({ name: '', balance: '', number: '' });
      setAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Account Manager</h3>
        <button onClick={() => setAdding(v => !v)} className="text-primary text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-2">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Account name"
            autoFocus
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            type="number"
            value={form.balance}
            onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
            placeholder="Starting balance"
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <input
            value={form.number}
            onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
            placeholder="Account number (e.g. ****1234)"
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-medium">
              Add Account
            </button>
            <button onClick={() => setAdding(false)} className="bg-card rounded-xl px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {accounts.map(a => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">💳</span>
              <div>
                <p className="font-medium text-sm">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.number} · ${a.balance.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => onDelete(a.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-3">No accounts yet</p>
        )}
      </div>
    </div>
  );
}

/* ─── Category Manager ────────────────────────────────────────── */
const EMOJI_OPTIONS = ['💰', '💻', '🍔', '🚗', '🎬', '💡', '🏠', '👗', '✈️', '💊', '🎮', '📚', '🏋️', '☕', '🛒', '🎁', '🏦', '🎵', '🐾', '🌿'];

function CategoryManager({
  categories, onAdd, onDelete
}: { categories: Category[]; onAdd: (c: Omit<Category, 'id'>) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', emoji: '💰', color: '#ec4899' });
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  const handleAdd = () => {
    if (form.name.trim()) {
      onAdd({ ...form, name: form.name.trim() });
      setForm({ name: '', type: 'expense', emoji: '💰', color: '#ec4899' });
      setAdding(false);
    }
  };

  const displayed = categories.filter(c => c.type === activeTab);
  const incomeCount = categories.filter(c => c.type === 'income').length;
  const expenseCount = categories.filter(c => c.type === 'expense').length;

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Category Manager</h3>
        <button onClick={() => setAdding(v => !v)} className="text-primary text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'income' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Income ({incomeCount})
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'expense' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Expense ({expenseCount})
        </button>
      </div>

      {adding && (
        <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['income', 'expense'] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                  form.type === t ? 'bg-primary text-white' : 'bg-card text-muted-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Category name"
            autoFocus
            className="w-full bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
          />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Choose an emoji</p>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm(f => ({ ...f, emoji }))}
                  className={`h-8 w-full rounded-lg text-base flex items-center justify-center transition-colors ${
                    form.emoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-card'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-medium">
              Add Category
            </button>
            <button onClick={() => setAdding(false)} className="bg-card rounded-xl px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {displayed.map(cat => (
          <div key={cat.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">{cat.emoji}</span>
              <span className="font-medium text-sm">{cat.name}</span>
            </div>
            <button onClick={() => onDelete(cat.id)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {displayed.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-3">No {activeTab} categories yet</p>
        )}
      </div>
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────── */
export function SettingsPage({
  profile, ledgers, accounts, categories,
  onUpdateProfile, onAddLedger, onDeleteLedger,
  onAddAccount, onDeleteAccount, onAddCategory, onDeleteCategory,
}: SettingsPageProps) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(true);

  const toggles = [
    { label: 'Notifications', value: notifications, set: setNotifications },
    { label: 'Dark Mode', value: darkMode, set: setDarkMode },
    { label: 'Biometric Login', value: biometric, set: setBiometric },
  ];

  return (
    <div className="p-6 max-w-md mx-auto pb-10">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      <ProfileSection profile={profile} onUpdate={onUpdateProfile} />
      <LedgerManager ledgers={ledgers} onAdd={onAddLedger} onDelete={onDeleteLedger} />
      <AccountManager accounts={accounts} onAdd={onAddAccount} onDelete={onDeleteAccount} />
      <CategoryManager categories={categories} onAdd={onAddCategory} onDelete={onDeleteCategory} />

      {/* Preferences */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-4">
        <h3 className="font-semibold mb-4">Preferences</h3>
        <div className="space-y-1">
          {toggles.map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span>{label}</span>
              <button
                onClick={() => set(v => !v)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${value ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${value ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Other */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
        <h3 className="font-semibold mb-4">Other</h3>
        <div className="space-y-1">
          {['Privacy Policy', 'Terms of Service', 'Help & Support'].map(item => (
            <button key={item} className="w-full text-left py-3 flex items-center justify-between hover:text-primary transition-colors border-b border-border last:border-0">
              <span>{item}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
          <button className="w-full text-left py-3 text-destructive hover:opacity-80 transition-opacity">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
