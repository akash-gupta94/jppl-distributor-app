'use client';

import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" />
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        <div className="card text-center py-16">
          <Construction className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description || 'This page is coming soon.'}</p>
        </div>
      </div>
    </div>
  );
}
