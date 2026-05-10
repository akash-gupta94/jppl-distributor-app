'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  userType: 'admin';
}

/**
 * Client hook: ensures the current session is an admin, redirecting to
 * /admin/login otherwise. Returns { user, loading } once resolved.
 */
export function useAdminUser() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (cancelled) return;
        if (!data.user || data.user.userType !== 'admin') {
          router.push('/admin/login');
          return;
        }
        setUser(data.user);
      } catch {
        router.push('/admin/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  return { user, loading };
}

export interface DistributorUser {
  id: string;
  phone: string;
  name: string;
  userType: 'distributor';
}

/**
 * Client hook: ensures the current session is a distributor, redirecting
 * to /distributor/login otherwise.
 */
export function useDistributorUser() {
  const router = useRouter();
  const [user, setUser] = useState<DistributorUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (cancelled) return;
        if (!data.user || data.user.userType !== 'distributor') {
          router.push('/distributor/login');
          return;
        }
        setUser(data.user);
      } catch {
        router.push('/distributor/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  return { user, loading };
}
