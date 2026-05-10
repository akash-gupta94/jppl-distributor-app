'use client';

import { useState } from 'react';
import { useAdminUser } from '@/lib/useAdminUser';
import AdminShell from '@/components/AdminShell';
import { KeyRound, Save, AlertCircle, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAdminUser();
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (pwd.newPassword !== pwd.confirm) {
      setPwdError('New password and confirmation do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error || 'Failed to change password');
        return;
      }
      setPwdSuccess('Password changed successfully');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  return (
    <AdminShell userName={user?.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Account credentials and system information.</p>
      </div>

      <section className="card mb-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold">Change admin password</h2>
        </div>
        {pwdError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {pwdError}
          </div>
        )}
        {pwdSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-3 text-sm">
            {pwdSuccess}
          </div>
        )}
        <form onSubmit={onChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Current password</label>
            <input required type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input required type="password" minLength={6} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm new password</label>
            <input required type="password" minLength={6} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className="input w-full" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="btn btn-primary inline-flex items-center disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </section>

      <section className="card max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold">OTP &amp; SMS</h2>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          OTP delivery is currently in <strong>mock mode</strong>: the OTP is shown on the distributor login screen and any 6-digit code is rejected unless it matches.
          The mock OTP is fixed at <code>123456</code>.
        </p>
        <p className="text-sm text-gray-700">
          To enable real SMS delivery, set the <code>OTP_PROVIDER</code> environment variable on the server (e.g. <code>twilio</code>) and provide the corresponding credentials. The <code>src/lib/otp.ts</code> mock will then fall back to a real generator.
        </p>
      </section>
    </AdminShell>
  );
}
