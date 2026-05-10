'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Plus, FileText, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  distributor: { name: string; phone: string };
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  isActive: boolean;
}

export default function InvoicesListPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/invoices');
    const data = await res.json();
    setInvoices(data.invoices || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">Sale invoices issued to distributors. Payments link to these.</p>
        </div>
        <Link href="/admin/invoices/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New invoice
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 font-medium mb-1">No invoices yet</p>
            <p className="text-sm text-gray-500 mb-4">Create the first invoice to start tracking sales and payments.</p>
            <Link href="/admin/invoices/new" className="btn btn-primary inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Create invoice
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Distributor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.distributor.name}</td>
                  <td className="px-4 py-3">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(inv.balanceAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-green-50 text-green-700'
                          : inv.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/invoices/${inv.id}`} className="btn btn-secondary inline-flex items-center text-xs">
                      <Eye className="w-3 h-3 mr-1" /> Open
                    </Link>
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
