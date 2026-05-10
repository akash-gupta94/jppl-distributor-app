'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import {
  Users,
  Calendar,
  FileText,
  Wallet,
  TrendingUp,
  Plus,
  Tag,
  Layers,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  distributors: number;
  activeDistributors: number;
  activeSchemes: number;
  invoices: { count: number; totalAmount: number; paidAmount: number; balanceAmount: number };
  payments: { count: number; totalAmount: number };
  directSales: { count: number; totalAmount: number };
}

interface ReportRow {
  distributor: { id: string; name: string; levelName: string };
  schemeName: string | null;
  progress: null | {
    yearlyPct: number;
    currentQuarter: number;
    currentQuarterPct: number;
    yearlyRewardNext: string | null;
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAdminUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [sRes, rRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/reports'),
      ]);
      const sData = await sRes.json();
      const rData = await rRes.json();
      setStats(sData);
      setRows((rData.rows || []).filter((r: ReportRow) => r.progress).slice(0, 5));
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of distributors, schemes, invoices and payments.</p>
      </div>

      {loading || !stats ? (
        <div className="card p-6 text-center text-gray-500">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Active distributors" value={String(stats.activeDistributors)} hint={`${stats.distributors} total`} icon={Users} />
            <Stat label="Active schemes" value={String(stats.activeSchemes)} icon={Calendar} />
            <Stat label="Invoice value" value={formatCurrency(stats.invoices.totalAmount)} hint={`${stats.invoices.count} invoices`} icon={FileText} />
            <Stat label="Payments received" value={formatCurrency(stats.payments.totalAmount)} hint={`${stats.payments.count} payments`} icon={Wallet} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Top distributors (current scheme)</h2>
                <Link href="/admin/reports" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No progress data yet. Add invoices &amp; payments to see live tracking.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="py-2">Distributor</th>
                      <th className="py-2">Year</th>
                      <th className="py-2">Quarter</th>
                      <th className="py-2">Next reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.distributor.id} className="border-t">
                        <td className="py-2">
                          <div className="font-medium">{r.distributor.name}</div>
                          <div className="text-xs text-gray-500">{r.distributor.levelName} • {r.schemeName}</div>
                        </td>
                        <td className="py-2">{r.progress?.yearlyPct.toFixed(0)}%</td>
                        <td className="py-2">Q{r.progress?.currentQuarter} {r.progress?.currentQuarterPct.toFixed(0)}%</td>
                        <td className="py-2 text-xs text-gray-600">{r.progress?.yearlyRewardNext || 'Top tier or unset'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold mb-4">Outstanding</h2>
              <div className="space-y-3 text-sm">
                <Row label="Total invoiced" value={formatCurrency(stats.invoices.totalAmount)} />
                <Row label="Paid" value={formatCurrency(stats.invoices.paidAmount)} />
                <Row label="Balance" value={formatCurrency(stats.invoices.balanceAmount)} highlight />
                <hr />
                <Row label="Direct sales" value={formatCurrency(stats.directSales.totalAmount)} hint={`${stats.directSales.count} entries`} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Quick actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <QuickAction href="/admin/distributors/new" icon={Plus} label="Add distributor" />
              <QuickAction href="/admin/schemes/new" icon={Calendar} label="Create scheme" />
              <QuickAction href="/admin/invoices/new" icon={FileText} label="New invoice" />
              <QuickAction href="/admin/sales" icon={TrendingUp} label="Add sales entry" />
              <QuickAction href="/admin/categories" icon={Tag} label="Manage categories" />
              <QuickAction href="/admin/levels" icon={Layers} label="Manage levels" />
              <QuickAction href="/admin/reports" icon={BarChart3} label="Reports" />
              <QuickAction href="/admin/distributors" icon={Users} label="Distributors" />
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: any }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <p className={`font-semibold ${highlight ? 'text-amber-700' : ''}`}>{value}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="card hover:shadow-md transition flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
