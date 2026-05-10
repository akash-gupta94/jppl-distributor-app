'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Tag,
  Calendar,
  FileText,
  Wallet,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

interface AdminShellProps {
  userName?: string;
  children: React.ReactNode;
}

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/distributors', label: 'Distributors', icon: Users },
  { href: '/admin/levels', label: 'Levels', icon: Layers },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/schemes', label: 'Schemes', icon: Calendar },
  { href: '/admin/invoices', label: 'Invoices', icon: FileText },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/sales', label: 'Sales', icon: TrendingUp },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminShell({ userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="admin" userName={userName} />
      <div className="container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
          <aside className="hidden lg:block">
            <nav className="card p-2 sticky top-4">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                      active
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div>
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="btn btn-secondary inline-flex items-center"
              >
                {mobileNavOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
                Admin menu
              </button>
              {mobileNavOpen && (
                <nav className="card p-2 mt-2">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                          active
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
