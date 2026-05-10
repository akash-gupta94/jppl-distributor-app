'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import SchemeBuilder from '@/components/SchemeBuilder';

export default function NewSchemePage() {
  const { user, loading } = useAdminUser();
  if (loading) return null;
  return (
    <AdminShell userName={user?.name}>
      <Link href="/admin/schemes" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to schemes
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New scheme</h1>
      <p className="text-sm text-gray-600 mb-6">Configure dates, eligible distributor levels with targets and tiered rewards, and per-category weight + minimum mix.</p>
      <SchemeBuilder />
    </AdminShell>
  );
}
