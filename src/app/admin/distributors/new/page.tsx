'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { ArrowLeft, Save } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  code: string;
}

export default function NewDistributorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminUser();
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    distributorLevelId: '',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const levelsRes = await fetch('/api/levels');
      const levelsData = await levelsRes.json();
      setLevels(levelsData.levels || []);
    })();
  }, [user]);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create distributor');
      router.push('/admin/distributors');
    } catch (err: any) {
      setError(err.message || 'Failed to create distributor');
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
          <h1 className="text-3xl font-bold text-gray-900">Add Distributor</h1>
          <p className="text-gray-600 mt-1">Register a new distributor in the network</p>
        </div>

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
              <input type="tel" required value={form.phone} onChange={handleChange('phone')} placeholder="9876543210" className="input w-full" />
              <p className="text-xs text-gray-500 mt-1">10-digit number, +91 will be added automatically</p>
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
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn btn-primary inline-flex items-center disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Distributor'}
            </button>
            <Link href="/admin/distributors" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
