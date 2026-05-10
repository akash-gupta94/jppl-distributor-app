'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import SchemeBuilder from '@/components/SchemeBuilder';

export default function EditSchemePage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAdminUser();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const res = await fetch(`/api/admin/schemes/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load scheme');
        setLoading(false);
        return;
      }
      setScheme(data);
      setLoading(false);
    })();
  }, [user, id]);

  if (authLoading) return null;
  return (
    <AdminShell userName={user?.name}>
      <Link href="/admin/schemes" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to schemes
      </Link>
      {loading ? (
        <div className="card p-6 text-center text-gray-500">Loading…</div>
      ) : error ? (
        <div className="card p-6 text-center text-red-700">{error}</div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit: {scheme.name}</h1>
          <p className="text-sm text-gray-600 mb-6">Changes update levels and category configs in place.</p>
          <SchemeBuilder existing={scheme} />
        </>
      )}
    </AdminShell>
  );
}
