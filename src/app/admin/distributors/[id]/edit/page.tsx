'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { ArrowLeft, Save } from 'lucide-react';

interface Level { id: string; name: string; code: string; }

export default function EditDistributorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAdminUser();
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '',
    pincode: '', gstNumber: '', distributorLevelId: '', isActive: true,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [levelsRes, distRes] = await Promise.all([
        fetch('/api/levels'),
        fetch(`/api/admin/distributors/${id}`),
      ]);
      const levelsData = await levelsRes.json();
      setLevels(levelsData.levels || []);

      if (distRes.ok) {
        const d = await distRes.json();
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || '',
          pincode: d.pincode || '',
          gstNumber: d.gstNumber || '',
          distributorLevelId: d.distributorLevelId || '',
          isActive: d.isActive,
        });
      } else {
        setError('Distributor not found');
      }
      setLoading(false);
    })();
  }, [user, id]);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [key]: value as any });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/distributors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update distributor');
      router.push('/admin/distributors');
    } catch (err: any) {
      setError(err.message || 'Failed to update distributor');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="max-w-3xl">
        <Link href="/admin/distributors" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Distributors
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Distributor</h1>
        </div>

        {loading ? (
          <div className="card p-6 text-center text-gray-500">Loading…</div>
        ) : (
          <>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" required value={form.name} onChange={handleChange('name')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" required value={form.phone} onChange={handleChange('phone')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Level *</label>
              <select required value={form.distributorLevelId} onChange={handleChange('distributorLevelId')} className="input w-full">
                <option value="">Select level</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={handleChange('email')} className="input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={handleChange('address')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={handleChange('city')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={form.state} onChange={handleChange('state')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input type="text" value={form.pincode} onChange={handleChange('pincode')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input type="text" value={form.gstNumber} onChange={handleChange('gstNumber')} className="input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={form.isActive} onChange={handleChange('isActive')} className="mr-2" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn btn-primary inline-flex items-center disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin/distributors" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
        </>
        )}
      </div>
    </AdminShell>
  );
}
