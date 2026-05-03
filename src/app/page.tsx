import Link from 'next/link';
import { Building2, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            JPPL Distributor Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            JPP and Company General Politics Private Limited
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Distributor Management & Rewards System
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Admin Login Card */}
          <Link href="/admin/login">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
                <p className="text-gray-600 mb-6">
                  Manage distributors, schemes, invoices, and track performance
                </p>
                <div className="btn btn-primary w-full">
                  Admin Login
                </div>
              </div>
            </div>
          </Link>

          {/* Distributor Login Card */}
          <Link href="/distributor/login">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Distributor Portal</h2>
                <p className="text-gray-600 mb-6">
                  View your targets, achievements, and rewards
                </p>
                <div className="btn bg-green-600 text-white hover:bg-green-700 w-full">
                  Distributor Login
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2024 JPP and Company General Politics Private Limited. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
