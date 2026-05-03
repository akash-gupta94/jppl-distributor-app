'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Plus, Search, Edit, Trash2, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';

interface Distributor {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  isActive: boolean;
  distributorLevel: { name: string; code: string };
}

export default function DistributorsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (!sessionData.user || sessionData.user.userType !== 'admin') {
        router.push('/admin/login');
        return;
      }
      setUser(sessionData.user);
      await loadDistributors('');
    })();
  }, [router]);

  const loadDistributors = async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/admin/distributors?search=${encodeURIComponent(q)}` : '/api/admin/distributors';
      const res = await fetch(url);
      const data = await res.json();
      setDistributors(data.distributors || []);
    } catch {
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDistributors(search);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate distributor "${name}"?`)) return;
    const res = await fetch(`/api/admin/distributors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadDistributors(search);
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to deactivate');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName={user?.name} />
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Distributors</h1>
            <p className="text-gray-600 mt-1">Manage your distributor network</p>
          </div>
          <Link href="/admin/distributors/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Distributor
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, city..."
              className="input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="card text-center py-12 text-gray-500">Loading distributors...</div>
        ) : distributors.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p className="mb-4">No distributors found.</p>
            <Link href="/admin/distributors/new" className="btn btn-primary inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Add the first distributor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {distributors.map((d) => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.name}</h3>
                    <span className="inline-block text-xs px-2 py-0.5 mt-1 rounded bg-primary-50 text-primary-700">
                      {d.distributorLevel.name}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${d.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center"><Phone className="w-4 h-4 mr-2" />{d.phone}</div>
                  {d.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-2" />{d.email}</div>}
                  {(d.city || d.state) && (
                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{[d.city, d.state].filter(Boolean).join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/distributors/${d.id}/edit`} className="btn btn-secondary flex-1 inline-flex items-center justify-center text-sm">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Link>
                  {d.isActive && (
                    <button onClick={() => handleDelete(d.id, d.name)} className="btn btn-secondary text-red-600 inline-flex items-center justify-center text-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
