import { useState } from 'react';
import { Check, ImagePlus, LogOut, Pencil, Plus, Trash2, X } from 'lucide-react';
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
  onUpdateLedgerName: (id: string, name: string) => void;
  onDeleteLedger: (id: string) => void;
  onAddAccount: (account: Omit<Account, 'id' | 'ledgerId'>) => void;
  onUpdateAccountName: (id: string, name: string) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'ledgerId'>) => void;
  onUpdateCategoryName: (id: string, name: string) => void;
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

function LedgerManager({ ledgers, activeLedgerId, onSelect, onAdd, onUpdateName, onDelete }: { ledgers: Ledger[]; activeLedgerId: string | null; onSelect: (id: string) => void; onAdd: (name: string) => void; onUpdateName: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [ledgerToDelete, setLedgerToDelete] = useState<Ledger | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
  };

  const startEditing = (ledger: Ledger) => {
    setEditingId(ledger.id);
    setEditingName(ledger.name);
  };

  const handleUpdate = () => {
    if (!editingId || !editingName.trim()) return;
    onUpdateName(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
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
              {editingId === ledger.id ? (
                <div className="flex min-w-0 flex-1 gap-2">
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} autoFocus className="min-w-0 flex-1 bg-card rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                  <button onClick={handleUpdate} className="bg-primary text-white rounded-xl px-3"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="bg-muted rounded-xl px-3"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <button onClick={() => onSelect(ledger.id)} className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ledger.name}</p>
                    <p className="text-xs text-muted-foreground">{activeLedgerId === ledger.id ? 'Current ledger' : 'Switch to this ledger'}</p>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditing(ledger)} className="p-1 text-primary hover:opacity-70 transition-opacity" aria-label="Edit ledger name"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setLedgerToDelete(ledger)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity" aria-label="Delete ledger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {ledgers.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No ledgers yet. Add one to begin.</p>}
        </div>
      </Section>

      {ledgerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" role="dialog" aria-modal="true" aria-labelledby="delete-ledger-title">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 id="delete-ledger-title" className="text-center text-lg font-semibold">Delete ledger?</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Deleting {ledgerToDelete.name} will also remove the accounts, categories, transactions, transfers, and bills stored in this ledger.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setLedgerToDelete(null)} className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(ledgerToDelete.id);
                  setLedgerToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccountManager({ accounts, canAdd, onAdd, onUpdateName, onDelete }: { accounts: Account[]; canAdd: boolean; onAdd: (account: Omit<Account, 'id' | 'ledgerId'>) => void; onUpdateName: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ kind: 'bank' as Account['kind'], name: '', balance: '', number: '', qrImage: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

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

  const startEditing = (account: Account) => {
    setEditingId(account.id);
    setEditingName(account.name);
  };

  const handleUpdate = () => {
    if (!editingId || !editingName.trim()) return;
    onUpdateName(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
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
              {editingId === account.id ? (
                <div className="flex min-w-0 flex-1 gap-2">
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} autoFocus className="min-w-0 flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                  <button onClick={handleUpdate} className="bg-primary text-white rounded-xl px-3"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="bg-muted rounded-xl px-3"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.kind} - {formatPeso(account.balance)}{account.number ? ` - ${account.number}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditing(account)} className="p-1 text-primary hover:opacity-70 transition-opacity" aria-label="Edit account name"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setAccountToDelete(account)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity" aria-label="Delete account"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {canAdd && accounts.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No accounts yet. Add account details to display data.</p>}
        </div>
      </Section>

      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 id="delete-account-title" className="text-center text-lg font-semibold">Delete account?</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Deleting {accountToDelete.name} only removes the account. Its transaction and transfer history will stay saved and can still be viewed from All history.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setAccountToDelete(null)} className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(accountToDelete.id);
                  setAccountToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryManager({ categories, canAdd, onAdd, onUpdateName, onDelete }: { categories: Category[]; canAdd: boolean; onAdd: (category: Omit<Category, 'id' | 'ledgerId'>) => void; onUpdateName: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [form, setForm] = useState({ name: '', icon: 'wallet' as CategoryIconKey });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

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

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleUpdate = () => {
    if (!editingId || !editingName.trim()) return;
    onUpdateName(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
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
              {editingId === category.id ? (
                <div className="flex min-w-0 flex-1 gap-2">
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdate()} autoFocus className="min-w-0 flex-1 bg-muted rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                  <button onClick={handleUpdate} className="bg-primary text-white rounded-xl px-3"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="bg-muted rounded-xl px-3"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center"><CategoryIcon icon={category.icon} className="w-4 h-4" /></span>
                    <span className="font-medium text-sm truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditing(category)} className="p-1 text-primary hover:opacity-70 transition-opacity" aria-label="Edit category name"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setCategoryToDelete(category)} className="p-1 text-rose-500 hover:opacity-70 transition-opacity" aria-label="Delete category"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {canAdd && displayed.length === 0 && <p className="text-muted-foreground text-sm text-center py-3">No {activeTab} categories yet. Add details to display data.</p>}
        </div>
      </Section>

      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 id="delete-category-title" className="text-center text-lg font-semibold">Delete category?</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Deleting {categoryToDelete.name} only removes the category. Your transaction history and saved data will stay the same.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setCategoryToDelete(null)} className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(categoryToDelete.id);
                  setCategoryToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SettingsPage({ profile, ledgers, activeLedgerId, accounts, categories, onSelectLedger, onUpdateProfile, onAddLedger, onUpdateLedgerName, onDeleteLedger, onAddAccount, onUpdateAccountName, onDeleteAccount, onAddCategory, onUpdateCategoryName, onDeleteCategory, notificationsEnabled, onSetNotificationsEnabled, darkMode, onSetDarkMode, onLogout }: SettingsPageProps) {
  const toggles = [
    { label: 'Notifications', value: notificationsEnabled, set: onSetNotificationsEnabled },
    { label: 'Dark Mode', value: darkMode, set: onSetDarkMode },
  ];

  return (
    <div className="p-6 max-w-md mx-auto pb-10">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      <ProfileSection profile={profile} onUpdate={onUpdateProfile} />
      <LedgerManager ledgers={ledgers} activeLedgerId={activeLedgerId} onSelect={onSelectLedger} onAdd={onAddLedger} onUpdateName={onUpdateLedgerName} onDelete={onDeleteLedger} />
      <AccountManager accounts={accounts} canAdd={Boolean(activeLedgerId)} onAdd={onAddAccount} onUpdateName={onUpdateAccountName} onDelete={onDeleteAccount} />
      <CategoryManager categories={categories} canAdd={Boolean(activeLedgerId)} onAdd={onAddCategory} onUpdateName={onUpdateCategoryName} onDelete={onDeleteCategory} />

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
