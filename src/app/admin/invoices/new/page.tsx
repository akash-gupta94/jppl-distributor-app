'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
interface Distributor {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}
interface LineItem {
  itemCategoryId: string;
  quantity: number;
  rate: number;
  amount: number;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(isoToday());
  const [creditDays, setCreditDays] = useState(30);
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [dRes, cRes] = await Promise.all([
        fetch('/api/admin/distributors?limit=500'),
        fetch('/api/admin/categories'),
      ]);
      const dData = await dRes.json();
      const cData = await cRes.json();
      const ds: Distributor[] = (dData.distributors || []).filter((d: Distributor) => d.isActive);
      const cs: Category[] = (cData.categories || []).filter((c: Category) => c.isActive);
      setDistributors(ds);
      setCategories(cs);
      if (cs.length) setItems([{ itemCategoryId: cs[0].id, quantity: 0, rate: 0, amount: 0 }]);
      setLoading(false);
    })();
  }, [user]);

  const addRow = () => {
    if (!categories.length) return;
    setItems((prev) => [...prev, { itemCategoryId: categories[0].id, quantity: 0, rate: 0, amount: 0 }]);
  };
  const removeRow = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        merged.amount = Number((merged.quantity * merged.rate).toFixed(2));
        return merged;
      }),
    );
  };

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const dueDate = addDays(invoiceDate, creditDays);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!invoiceNumber || !distributorId) {
      setError('Invoice number and distributor are required');
      return;
    }
    const validItems = items.filter((it) => it.amount > 0 && it.itemCategoryId);
    if (!validItems.length) {
      setError('Add at least one line item with amount > 0');
      return;
    }
    setSaving(true);
    try {
      const body = {
        invoiceNumber,
        distributorId,
        invoiceDate,
        dueDate,
        items: validItems,
      };
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create invoice');
        return;
      }
      router.push(`/admin/invoices/${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminShell userName={user?.name}>
        <div className="card p-6 text-center text-gray-500">Loading…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell userName={user?.name}>
      <Link href="/admin/invoices" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to invoices
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New invoice</h1>
      <p className="text-sm text-gray-600 mb-6">Add line items per category — weighted totals are computed against scheme targets automatically.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice number *</label>
            <input required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="input w-full" placeholder="e.g. INV-2025-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Distributor *</label>
            <select required value={distributorId} onChange={(e) => setDistributorId(e.target.value)} className="input w-full">
              <option value="">Select distributor</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice date *</label>
            <input required type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Credit days</label>
            <input type="number" min={0} value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} className="input w-full" />
            <p className="text-xs text-gray-500 mt-1">Due date: {dueDate}</p>
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Line items</h2>
            <button type="button" onClick={addRow} className="btn btn-secondary text-sm inline-flex items-center">
              <Plus className="w-3 h-3 mr-1" /> Add row
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No item categories defined. <Link href="/admin/categories" className="text-primary-600 underline">Add categories first</Link>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2 w-28">Quantity</th>
                    <th className="px-2 py-2 w-28">Rate ₹</th>
                    <th className="px-2 py-2 w-32 text-right">Amount ₹</th>
                    <th className="px-2 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-2">
                        <select value={it.itemCategoryId} onChange={(e) => updateRow(i, { itemCategoryId: e.target.value })} className="input w-full">
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min={0} step="0.01" value={it.quantity} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })} className="input w-full" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min={0} step="0.01" value={it.rate} onChange={(e) => updateRow(i, { rate: Number(e.target.value) })} className="input w-full" />
                      </td>
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(it.amount)}</td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={() => removeRow(i)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={3} className="px-2 py-3 text-right">Total</td>
                    <td className="px-2 py-3 text-right">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <div className="flex gap-2">
          <button type="submit" disabled={saving || total <= 0} className="btn btn-primary inline-flex items-center disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Create invoice'}
          </button>
          <Link href="/admin/invoices" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </AdminShell>
  );
}
