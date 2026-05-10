'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { ArrowLeft, Plus, Trash2, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  distributor: { id: string; name: string; phone: string; distributorLevel: { name: string } };
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  isActive: boolean;
  items: Array<{ id: string; itemCategory: { name: string; code: string }; quantity: number; rate: number; amount: number }>;
  payments: Array<{ id: string; paymentDate: string; amount: number; paymentMode: string; referenceNo: string | null; remarks: string | null }>;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAdminUser();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [pay, setPay] = useState({
    amount: 0,
    paymentDate: isoToday(),
    paymentMode: 'CASH',
    referenceNo: '',
    remarks: '',
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/invoices/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load invoice');
      setLoading(false);
      return;
    }
    setInvoice(data);
    setPay((p) => ({ ...p, amount: data.balanceAmount }));
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user, id]);

  const onAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pay.amount || pay.amount <= 0) {
      alert('Enter a positive amount');
      return;
    }
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pay, invoiceId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to record payment');
      return;
    }
    setShowPay(false);
    load();
  };

  const onDeletePayment = async (pid: string) => {
    if (!confirm('Delete this payment? Invoice paid amount will be recalculated.')) return;
    const res = await fetch(`/api/admin/payments/${pid}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete');
      return;
    }
    load();
  };

  const onDeleteInvoice = async () => {
    if (!confirm('Mark this invoice inactive? Historical payments are preserved.')) return;
    const res = await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to delete');
      return;
    }
    router.push('/admin/invoices');
  };

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <Link href="/admin/invoices" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to invoices
      </Link>
      {loading ? (
        <div className="card p-6 text-center text-gray-500">Loading…</div>
      ) : error || !invoice ? (
        <div className="card p-6 text-center text-red-700">{error || 'Invoice not found'}</div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-600 mt-1">{invoice.distributor.name} • {invoice.distributor.distributorLevel.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onDeleteInvoice} className="btn btn-secondary text-sm text-red-600 inline-flex items-center">
                <XCircle className="w-3 h-3 mr-1" /> Deactivate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-xs text-gray-500">Invoice date</p>
              <p className="font-semibold">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Due date</p>
              <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500">Balance</p>
              <p className={`font-semibold ${invoice.balanceAmount > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {formatCurrency(invoice.balanceAmount)}
              </p>
            </div>
          </div>

          <section className="card mb-6">
            <h2 className="font-semibold mb-3">Line items</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Rate</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-2 py-2">{it.itemCategory.name} <span className="text-xs text-gray-500">({it.itemCategory.code})</span></td>
                    <td className="px-2 py-2 text-right">{it.quantity}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(it.rate)}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Payments</h2>
              {invoice.balanceAmount > 0 && (
                <button onClick={() => setShowPay(!showPay)} className="btn btn-primary text-sm inline-flex items-center">
                  <Plus className="w-3 h-3 mr-1" /> Record payment
                </button>
              )}
            </div>

            {showPay && (
              <form onSubmit={onAddPayment} className="border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input type="date" value={pay.paymentDate} onChange={(e) => setPay({ ...pay, paymentDate: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Amount ₹</label>
                  <input type="number" min={0} step="0.01" max={invoice.balanceAmount} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mode</label>
                  <select value={pay.paymentMode} onChange={(e) => setPay({ ...pay, paymentMode: e.target.value })} className="input w-full">
                    <option>CASH</option>
                    <option>CHEQUE</option>
                    <option>NEFT</option>
                    <option>RTGS</option>
                    <option>UPI</option>
                    <option>BANK_TRANSFER</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Reference no.</label>
                  <input value={pay.referenceNo} onChange={(e) => setPay({ ...pay, referenceNo: e.target.value })} className="input w-full" placeholder="Bank ref / UPI txn id" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                  <input value={pay.remarks} onChange={(e) => setPay({ ...pay, remarks: e.target.value })} className="input w-full" />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm">Save payment</button>
                  <button type="button" onClick={() => setShowPay(false)} className="btn btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            )}

            {invoice.payments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Mode</th>
                    <th className="px-2 py-2">Reference</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-2 py-2">{formatDate(p.paymentDate)}</td>
                      <td className="px-2 py-2">{p.paymentMode}</td>
                      <td className="px-2 py-2 text-gray-600">{p.referenceNo || '—'}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-2 py-2 text-right">
                        <button onClick={() => onDeletePayment(p.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
