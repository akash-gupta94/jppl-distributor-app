'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Wallet, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNo: string | null;
  remarks: string | null;
  invoice: { id: string; invoiceNumber: string; distributor: { name: string; phone: string } };
}

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/payments');
    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this payment? Invoice paid amount will be recalculated.')) return;
    const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-600 mt-1">All payments across distributors. Record new payments from an individual invoice.</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 font-medium mb-1">No payments yet</p>
            <p className="text-sm text-gray-500">Open an invoice to record payments against it.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distributor</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">{p.invoice.distributor.name}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/invoices/${p.invoice.id}`} className="text-primary-600 hover:underline">
                      {p.invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.paymentMode}</td>
                  <td className="px-4 py-3 text-gray-600">{p.referenceNo || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onDelete(p.id)} className="text-red-600 hover:text-red-800">
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
