'use client';

import { useEffect, useState } from 'react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Plus, Save, Trash2, X } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  code: string;
  description: string | null;
  priority: number;
  isActive: boolean;
  _count?: { distributors: number };
}

const empty = { name: '', code: '', priority: 1, description: '', isActive: true };

export default function LevelsPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/levels');
    const data = await res.json();
    setLevels(data.levels || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const onEdit = (lvl: Level) => {
    setEditing(lvl);
    setForm({
      name: lvl.name,
      code: lvl.code,
      priority: lvl.priority,
      description: lvl.description || '',
      isActive: lvl.isActive,
    });
    setShowForm(true);
    setError('');
  };
  const onAdd = () => {
    setEditing(null);
    setForm({ ...empty, priority: (levels[levels.length - 1]?.priority ?? 0) + 1 });
    setShowForm(true);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = editing ? `/api/admin/levels/${editing.id}` : '/api/admin/levels';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save');
      return;
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const onDelete = async (lvl: Level) => {
    const inUse = lvl._count?.distributors ?? 0;
    const msg = inUse
      ? `${lvl.name} has ${inUse} distributor(s). It will be deactivated rather than deleted. Continue?`
      : `Delete level "${lvl.name}"?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/levels/${lvl.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete');
      return;
    }
    load();
  };

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distributor Levels</h1>
          <p className="text-sm text-gray-600 mt-1">Tier definitions used when assigning distributors and configuring schemes.</p>
        </div>
        <button onClick={onAdd} className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add level
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Edit level' : 'New level'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="e.g. Platinum" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input w-full" placeholder="e.g. L2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority *</label>
              <input required type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="input w-full" />
              <p className="text-xs text-gray-500 mt-1">1 is highest tier.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Active</label>
              <select value={form.isActive ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'yes' })} className="input w-full">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary inline-flex items-center">
                <Save className="w-4 h-4 mr-2" />
                {editing ? 'Save' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : levels.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No levels defined yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Distributors</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lvl) => (
                <tr key={lvl.id} className="border-t">
                  <td className="px-4 py-3">{lvl.priority}</td>
                  <td className="px-4 py-3 font-medium">{lvl.name}</td>
                  <td className="px-4 py-3"><code>{lvl.code}</code></td>
                  <td className="px-4 py-3 text-gray-600">{lvl.description || '—'}</td>
                  <td className="px-4 py-3">{lvl._count?.distributors ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${lvl.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {lvl.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onEdit(lvl)} className="btn btn-secondary text-xs mr-1">Edit</button>
                    <button onClick={() => onDelete(lvl)} className="btn btn-secondary text-xs text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
