'use client';

import { useEffect, useState } from 'react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Plus, Save, Trash2, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
  weightage: number;
  isActive: boolean;
  _count?: { invoiceItems: number };
}

const empty = { name: '', code: '', weightage: 1.0, description: '', isActive: true };

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const onEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, weightage: c.weightage, description: c.description || '', isActive: c.isActive });
    setShowForm(true);
    setError('');
  };
  const onAdd = () => {
    setEditing(null);
    setForm({ ...empty });
    setShowForm(true);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
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

  const onDelete = async (c: Category) => {
    const inUse = c._count?.invoiceItems ?? 0;
    const msg = inUse
      ? `${c.name} is used in ${inUse} invoice item(s). It will be deactivated. Continue?`
      : `Delete category "${c.name}"?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
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
          <h1 className="text-2xl font-bold text-gray-900">Item Categories</h1>
          <p className="text-sm text-gray-600 mt-1">Default weightage applies if a scheme has no per-category override.</p>
        </div>
        <button onClick={onAdd} className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add category
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Edit category' : 'New category'}</h2>
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
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="e.g. Premium Finish" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input w-full" placeholder="e.g. CAT1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default weightage *</label>
              <input required type="number" step="0.01" min={0} value={form.weightage} onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })} className="input w-full" />
              <p className="text-xs text-gray-500 mt-1">1.0 = 100% of sales value. Used when a scheme has no override.</p>
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
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No categories defined yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Weightage</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Used in</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3"><code>{c.code}</code></td>
                  <td className="px-4 py-3">{(c.weightage * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-gray-600">{c.description || '—'}</td>
                  <td className="px-4 py-3">{c._count?.invoiceItems ?? 0} items</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onEdit(c)} className="btn btn-secondary text-xs mr-1">Edit</button>
                    <button onClick={() => onDelete(c)} className="btn btn-secondary text-xs text-red-600">
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
