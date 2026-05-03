'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Building2, Users } from 'lucide-react';

interface NavbarProps {
  userType: 'admin' | 'distributor';
  userName?: string;
}

export default function Navbar({ userType, userName }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            {userType === 'admin' ? (
              <Building2 className="w-6 h-6 text-primary-600" />
            ) : (
              <Users className="w-6 h-6 text-green-600" />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {userType === 'admin' ? 'Admin Portal' : 'Distributor Portal'}
              </h1>
              <p className="text-xs text-gray-500">JPPL Management System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userName && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userType}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
