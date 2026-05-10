'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { Plus, Calendar, Edit, XCircle } from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  allowOverlap: boolean;
  schemeLevels: Array<{ id: string; distributorLevel: { name: string; code: string } }>;
  schemeCategories: Array<{ id: string; itemCategory: { name: string }; weight: number; minMix: number }>;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SchemesListPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/schemes');
    const data = await res.json();
    setSchemes(data.schemes || []);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const onClose = async (s: Scheme) => {
    if (!confirm(`Close scheme "${s.name}"? It will become inactive but historical data is preserved.`)) return;
    const res = await fetch(`/api/admin/schemes/${s.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to close scheme');
      return;
    }
    load();
  };

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schemes</h1>
          <p className="text-sm text-gray-600 mt-1">Annual or custom-period reward programs.</p>
        </div>
        <Link href="/admin/schemes/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New scheme
        </Link>
      </div>

      {loading ? (
        <div className="card p-6 text-center text-gray-500">Loading…</div>
      ) : schemes.length === 0 ? (
        <div className="card p-10 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-700 font-medium mb-1">No schemes yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first scheme to start tracking targets and rewards.</p>
          <Link href="/admin/schemes/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create scheme
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schemes.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-500">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.allowOverlap && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">Allows overlap</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>
              {s.description && <p className="text-sm text-gray-600 mb-3">{s.description}</p>}
              <div className="text-sm space-y-2 mb-4">
                <div>
                  <span className="text-gray-500">Eligible levels: </span>
                  {s.schemeLevels.length === 0 ? (
                    <span className="text-gray-400">None configured</span>
                  ) : (
                    <span className="font-medium">{s.schemeLevels.map((sl) => sl.distributorLevel.name).join(', ')}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Categories: </span>
                  {s.schemeCategories.length === 0 ? (
                    <span className="text-gray-400">No category config</span>
                  ) : (
                    <span className="font-medium">
                      {s.schemeCategories.map((sc) => `${sc.itemCategory.name} (${sc.weight}%)`).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/schemes/${s.id}`} className="btn btn-secondary inline-flex items-center text-sm">
                  <Edit className="w-3 h-3 mr-1" /> View / Edit
                </Link>
                {s.isActive && (
                  <button onClick={() => onClose(s)} className="btn btn-secondary text-sm text-red-600 inline-flex items-center">
                    <XCircle className="w-3 h-3 mr-1" /> Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
