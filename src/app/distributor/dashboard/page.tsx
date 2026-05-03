'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Target, TrendingUp, Award, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DistributorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check session
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.user || sessionData.user.userType !== 'distributor') {
        router.push('/distributor/login');
        return;
      }

      setUser(sessionData.user);

      // Fetch dashboard data
      const dashRes = await fetch('/api/distributor/dashboard');
      const dashData = await dashRes.json();

      setDashboardData(dashData);
    } catch (error) {
      console.error('Error:', error);
      router.push('/distributor/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userType="distributor" userName={dashboardData.distributor.name} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {dashboardData.distributor.name}!</h2>
          <p className="text-gray-600 mt-1">
            Level: <span className="font-semibold text-green-600">{dashboardData.distributor.level}</span>
            {' '} | Current Period: {dashboardData.currentPeriod.quarter} ({dashboardData.currentPeriod.financialYear})
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quarterly Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboardData.summary.quarterlySales)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quarterly Paid</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboardData.summary.quarterlyPaid)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yearly Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboardData.summary.yearlySales)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardData.pendingInvoices.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {dashboardData.achievements.map((achievement: any, index: number) => (
          <div key={index} className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {achievement.scheme.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{achievement.scheme.period}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quarterly Achievement */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Quarterly Target ({achievement.quarterly.quarter})
                  </h4>
                  <Target className="w-5 h-5 text-primary-600" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Target</span>
                      <span className="font-medium">
                        {formatCurrency(achievement.quarterly.target)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Achieved</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(achievement.quarterly.achieved)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold text-primary-600">
                        {achievement.quarterly.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(achievement.quarterly.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Potential Reward</span>
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-600">
                          {formatCurrency(achievement.quarterly.reward)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly Achievement */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Yearly Target</h4>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Target</span>
                      <span className="font-medium">
                        {formatCurrency(achievement.yearly.target)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Achieved</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(achievement.yearly.achieved)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold text-green-600">
                        {achievement.yearly.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(achievement.yearly.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Potential Reward</span>
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-600">
                          {formatCurrency(achievement.yearly.reward)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {dashboardData.achievements.length === 0 && (
          <div className="card text-center py-12">
            <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Schemes</h3>
            <p className="text-gray-600">There are currently no active reward schemes for your level.</p>
          </div>
        )}

        {/* Pending Invoices */}
        {dashboardData.pendingInvoices.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Invoices</h3>
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.pendingInvoices.map((invoice: any) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        {formatCurrency(invoice.balanceAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`badge ${
                            invoice.paymentStatus === 'PAID'
                              ? 'badge-success'
                              : invoice.paymentStatus === 'PARTIAL'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
