'use client';

import { useEffect, useState } from 'react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Distributor {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}
interface SalesEntry {
  id: string;
  entryDate: string;
  amount: number;
  remarks: string | null;
  distributor: { id: string; name: string; phone: string };
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    distributorId: '',
    entryDate: isoToday(),
    amount: 0,
    remarks: '',
  });
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const [sRes, dRes] = await Promise.all([
      fetch('/api/admin/sales'),
      fetch('/api/admin/distributors?limit=500'),
    ]);
    const sData = await sRes.json();
    const dData = await dRes.json();
    setEntries(sData.sales || []);
    const ds = (dData.distributors || []).filter((d: Distributor) => d.isActive);
    setDistributors(ds);
    if (!form.distributorId && ds[0]) setForm((f) => ({ ...f, distributorId: ds[0].id }));
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.distributorId || form.amount <= 0) {
      setError('Distributor and amount > 0 are required');
      return;
    }
    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save');
      return;
    }
    setForm({ ...form, amount: 0, remarks: '' });
    setShowForm(false);
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this sales entry?')) return;
    const res = await fetch(`/api/admin/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to delete');
      return;
    }
    load();
  };

  const filtered = filter
    ? entries.filter((e) => e.distributor.name.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Date-wise Sales</h1>
          <p className="text-sm text-gray-600 mt-1">
            Direct sales entries (no category attribution). For category-weighted target tracking, use invoices with line items.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add entry
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New sales entry</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Distributor</label>
              <select required value={form.distributorId} onChange={(e) => setForm({ ...form, distributorId: e.target.value })} className="input w-full">
                <option value="">Select distributor</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date</label>
              <input required type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Amount ₹</label>
              <input required type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Remarks</label>
              <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="input w-full" placeholder="Optional" />
            </div>
            <div className="md:col-span-4 flex gap-2">
              <button type="submit" className="btn btn-primary text-sm inline-flex items-center">
                <Save className="w-3 h-3 mr-1" /> Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card mb-3 p-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by distributor name…"
          className="input w-full"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No sales entries.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distributor</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">{formatDate(e.entryDate)}</td>
                  <td className="px-4 py-3">{e.distributor.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{e.remarks || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onDelete(e.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
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
