'use client';

import { useEffect, useState } from 'react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { formatCurrency } from '@/lib/utils';

interface Row {
  distributor: { id: string; name: string; phone: string; levelName: string };
  schemeName: string | null;
  progress: null | {
    yearlyPct: number;
    yearlyTarget: number;
    weightedSales: number;
    rawSales: number;
    currentQuarter: 1 | 2 | 3 | 4;
    currentQuarterPct: number;
    currentQuarterTimely: number;
    currentQuarterTarget: number;
    yearlyRewardNext: string | null;
  };
}

interface Scheme {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemeId, setSchemeId] = useState('');

  const load = async (sid?: string) => {
    setLoading(true);
    const url = sid ? `/api/admin/reports?schemeId=${sid}` : '/api/admin/reports';
    const res = await fetch(url);
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sRes = await fetch('/api/admin/schemes?isActive=true');
      const sData = await sRes.json();
      setSchemes(sData.schemes || []);
      load();
    })();
  }, [user]);

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600 mt-1">Live progress per distributor against the active scheme.</p>
      </div>

      <div className="card mb-4 p-3">
        <label className="block text-xs text-gray-600 mb-1">Scheme</label>
        <select
          value={schemeId}
          onChange={(e) => {
            setSchemeId(e.target.value);
            load(e.target.value || undefined);
          }}
          className="input w-full md:w-96"
        >
          <option value="">Auto-pick per distributor</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No distributors to report on.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">Distributor</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Scheme</th>
                  <th className="px-4 py-3">Year sales</th>
                  <th className="px-4 py-3">Year %</th>
                  <th className="px-4 py-3">Quarter</th>
                  <th className="px-4 py-3">Q timely</th>
                  <th className="px-4 py-3">Q %</th>
                  <th className="px-4 py-3">Next reward</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.distributor.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.distributor.name}</td>
                    <td className="px-4 py-3">{r.distributor.levelName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.schemeName || '—'}</td>
                    {r.progress ? (
                      <>
                        <td className="px-4 py-3">
                          {formatCurrency(r.progress.weightedSales)}
                          <div className="text-xs text-gray-500">target {formatCurrency(r.progress.yearlyTarget)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-primary-500 rounded"
                                style={{ width: `${Math.min(100, Math.max(0, r.progress.yearlyPct))}%` }}
                              />
                            </div>
                            <span>{r.progress.yearlyPct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">Q{r.progress.currentQuarter}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(r.progress.currentQuarterTimely)}
                          <div className="text-xs text-gray-500">target {formatCurrency(r.progress.currentQuarterTarget)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-amber-500 rounded"
                                style={{ width: `${Math.min(100, Math.max(0, r.progress.currentQuarterPct))}%` }}
                              />
                            </div>
                            <span>{r.progress.currentQuarterPct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{r.progress.yearlyRewardNext || 'Top tier or unset'}</td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-4 py-3 text-gray-400">No matching scheme</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
