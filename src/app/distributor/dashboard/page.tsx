'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Award, AlertTriangle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import MobileBottomNav, { DealerView } from '@/components/MobileBottomNav';
import { useDistributorUser } from '@/lib/useAdminUser';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils';
import type { SchemeProgress } from '@/lib/achievement';

interface DashboardData {
  distributor: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstNumber: string | null;
    levelName: string;
    levelCode: string;
  };
  eligibleSchemes: Array<{ id: string; name: string; startDate: string; endDate: string }>;
  progress: SchemeProgress | null;
}

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function ProgressBar({ pct, color = 'green' }: { pct: number; color?: 'green' | 'amber' | 'blue' }) {
  const colors = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  };
  return (
    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${colors[color]} transition-all`} style={{ width: `${clampPct(pct)}%` }} />
    </div>
  );
}

function Ring({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const c = clampPct(pct);
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (c / 100) * circumference;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} stroke="#f3f4f6" strokeWidth="8" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={r}
            stroke="#16a34a"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{Math.round(c)}%</div>
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{sub}</p>
      </div>
    </div>
  );
}

export default function DistributorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useDistributorUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DealerView>('home');
  const [schemeId, setSchemeId] = useState<string | undefined>(undefined);
  const [showSchemePicker, setShowSchemePicker] = useState(false);

  const load = async (sid?: string) => {
    setLoading(true);
    const url = sid ? `/api/distributor/dashboard?schemeId=${sid}` : '/api/distributor/dashboard';
    const res = await fetch(url);
    const d = await res.json();
    setData(d);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load(schemeId);
  }, [user, schemeId]);

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{data?.distributor.levelName ?? '—'}</p>
            <h1 className="text-base font-semibold text-gray-900 truncate">{data?.distributor.name ?? user?.name}</h1>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-500 hover:text-gray-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto px-4 py-4 space-y-4">
        {loading || !data ? (
          <div className="card text-center text-gray-500">Loading…</div>
        ) : !data.progress ? (
          <NoSchemeView levelName={data.distributor.levelName} />
        ) : (
          <>
            {data.eligibleSchemes.length > 1 && (
              <SchemePicker
                schemes={data.eligibleSchemes}
                currentId={data.progress.scheme.id}
                open={showSchemePicker}
                onToggle={() => setShowSchemePicker(!showSchemePicker)}
                onSelect={(id) => {
                  setSchemeId(id);
                  setShowSchemePicker(false);
                }}
              />
            )}
            {view === 'home' && <HomeView data={data} />}
            {view === 'targets' && <TargetsView data={data} />}
            {view === 'rewards' && <RewardsView data={data} />}
            {view === 'ledger' && <LedgerView data={data} />}
            {view === 'profile' && <ProfileView data={data} onLogout={onLogout} />}
          </>
        )}
      </main>

      <MobileBottomNav view={view} onChange={setView} />
    </div>
  );
}

function NoSchemeView({ levelName }: { levelName: string }) {
  return (
    <div className="card text-center py-10">
      <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
      <p className="font-medium text-gray-900 mb-1">No active scheme for {levelName}</p>
      <p className="text-sm text-gray-500">Once admin assigns this level to a scheme, your targets and rewards will appear here.</p>
    </div>
  );
}

function SchemePicker({
  schemes,
  currentId,
  open,
  onToggle,
  onSelect,
}: {
  schemes: Array<{ id: string; name: string }>;
  currentId: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const current = schemes.find((s) => s.id === currentId);
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-gray-500 mr-2">Scheme:</span>
        <span className="font-medium flex-1 text-left truncate">{current?.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {schemes.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-4 py-3 text-sm border-t first:border-t-0 ${
                s.id === currentId ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeView({ data }: { data: DashboardData }) {
  const p = data.progress!;
  const currentQ = p.quarters[p.currentQuarter - 1];
  const totalRewardEarned =
    p.quarters.reduce((s, q) => s + (q.reward.achieved ? q.flatReward : 0), 0) +
    (p.yearly.reward.achieved ? p.yearly.flatReward : 0);
  return (
    <>
      <section className="rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 text-white p-5">
        <p className="text-xs opacity-80 uppercase tracking-wide">{p.scheme.name}</p>
        <h2 className="text-xl font-bold mt-1">{data.distributor.levelName} track</h2>
        <p className="text-xs opacity-80 mt-1">{formatDate(p.scheme.startDate)} → {formatDate(p.scheme.endDate)}</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs opacity-80">Q{p.currentQuarter} progress</p>
            <p className="text-lg font-bold">{Math.round(currentQ.pct)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs opacity-80">Year progress</p>
            <p className="text-lg font-bold">{Math.round(p.yearly.pct)}%</p>
          </div>
        </div>
      </section>

      <section className="card !p-4">
        <Ring
          pct={currentQ.pct}
          label={`Quarter ${p.currentQuarter} (timely-paid invoices)`}
          sub={`${formatCurrency(currentQ.timelyPaidValue)} of ${formatCurrency(currentQ.target)}`}
        />
        <div className="mt-4">
          <Ring
            pct={p.yearly.pct}
            label="Year (weighted sales)"
            sub={`${formatCurrency(p.yearly.weightedSales)} of ${formatCurrency(p.yearly.target)}`}
          />
        </div>
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" />Reward earned so far</h3>
        <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRewardEarned)}</p>
        <p className="text-xs text-gray-500 mt-1">Counts unlocked flat rewards across quarters &amp; year.</p>

        <div className="mt-4 space-y-2">
          <NextRewardLine label="Next quarter reward" reward={currentQ.reward.next} />
          <NextRewardLine label="Next yearly reward" reward={p.yearly.reward.next} />
        </div>
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-3">Category mix</h3>
        {p.categories.length === 0 ? (
          <p className="text-sm text-gray-500">No category configuration on this scheme.</p>
        ) : (
          <div className="space-y-3">
            {p.categories.map((c) => (
              <div key={c.itemCategoryId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className={c.unlocked ? 'text-green-700' : 'text-gray-500'}>
                    {Math.round(c.share)}% mix · {c.weight}% weight
                  </span>
                </div>
                <ProgressBar pct={c.minMix ? (c.share / c.minMix) * 100 : c.raw > 0 ? 100 : 0} color={c.unlocked ? 'green' : 'amber'} />
                {c.minMix > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min mix {c.minMix}% required · {c.unlocked ? 'on track' : 'needs focus'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function NextRewardLine({ label, reward }: { label: string; reward: { at: number; reward: string } | null }) {
  if (!reward) {
    return (
      <div className="flex items-center justify-between text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">Top tier or unset</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div>
        <p className="text-gray-700">{label}</p>
        <p className="text-xs text-gray-500">at {reward.at}% achievement</p>
      </div>
      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium">{reward.reward}</span>
    </div>
  );
}

function TargetsView({ data }: { data: DashboardData }) {
  const p = data.progress!;
  return (
    <>
      <section className="card !p-4">
        <h3 className="font-semibold mb-1">Quarterly targets</h3>
        <p className="text-xs text-gray-500 mb-3">Only invoices fully paid on or before due date count.</p>
        <div className="space-y-3">
          {p.quarters.map((q) => (
            <div key={q.quarter} className={`border rounded-lg p-3 ${q.quarter === p.currentQuarter ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">
                  Q{q.quarter}{' '}
                  <span className="text-xs text-gray-500 font-normal">
                    {formatDate(q.startDate)} → {formatDate(q.endDate)}
                  </span>
                </p>
                <span className="text-sm font-semibold">{Math.round(q.pct)}%</span>
              </div>
              <ProgressBar pct={q.pct} color={q.quarter === p.currentQuarter ? 'green' : 'blue'} />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Timely paid {formatCurrency(q.timelyPaidValue)}</span>
                <span>of {formatCurrency(q.target)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-1">Yearly target (weighted)</h3>
        <p className="text-xs text-gray-500 mb-3">Each item category contributes at its scheme weight.</p>
        <ProgressBar pct={p.yearly.pct} color="green" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{formatCurrency(p.yearly.weightedSales)}</span>
          <span>{Math.round(p.yearly.pct)}% of {formatCurrency(p.yearly.target)}</span>
        </div>
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-3">Category breakdown</h3>
        {p.categories.length === 0 ? (
          <p className="text-sm text-gray-500">No category configuration on this scheme.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {p.categories.map((c) => (
              <li key={c.itemCategoryId} className="py-2.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-700">{formatCurrency(c.weighted)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span>Raw {formatCurrency(c.raw)} · {Math.round(c.share)}% mix</span>
                  <span>weight {c.weight}%</span>
                </div>
                {c.reward && <p className="text-xs text-gray-500 mt-0.5">Reward: {c.reward}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function RewardsView({ data }: { data: DashboardData }) {
  const p = data.progress!;
  const currentQ = p.quarters[p.currentQuarter - 1];
  return (
    <>
      <section className="card !p-4">
        <h3 className="font-semibold mb-1">Quarterly reward tiers</h3>
        <p className="text-xs text-gray-500 mb-3">Linked to timely-payment performance for Q{p.currentQuarter}.</p>
        {currentQ.reward.tiers.length === 0 ? (
          <p className="text-sm text-gray-500">No reward tiers configured for your level on this scheme.</p>
        ) : (
          <ul className="space-y-2">
            {currentQ.reward.tiers.map((tier) => {
              const unlocked = currentQ.pct >= tier.at;
              return (
                <li key={tier.at} className={`flex items-center justify-between p-3 rounded-lg border ${unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-medium text-sm">{tier.reward}</p>
                    <p className="text-xs text-gray-500">at {tier.at}% achievement</p>
                  </div>
                  {unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {currentQ.flatReward > 0 && currentQ.reward.tiers.length === 0 && (
          <div className="border border-gray-200 rounded-lg p-3 mt-2">
            <p className="text-sm font-medium">Flat reward {formatCurrency(currentQ.flatReward)}</p>
            <p className="text-xs text-gray-500">unlocked at 100% achievement</p>
          </div>
        )}
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-1">Yearly reward tiers</h3>
        <p className="text-xs text-gray-500 mb-3">Linked to weighted category sales.</p>
        {p.yearly.reward.tiers.length === 0 ? (
          <p className="text-sm text-gray-500">No yearly reward tiers configured for your level on this scheme.</p>
        ) : (
          <ul className="space-y-2">
            {p.yearly.reward.tiers.map((tier) => {
              const unlocked = p.yearly.pct >= tier.at;
              return (
                <li key={tier.at} className={`flex items-center justify-between p-3 rounded-lg border ${unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-medium text-sm">{tier.reward}</p>
                    <p className="text-xs text-gray-500">at {tier.at}% achievement</p>
                  </div>
                  {unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {p.yearly.flatReward > 0 && p.yearly.reward.tiers.length === 0 && (
          <div className="border border-gray-200 rounded-lg p-3 mt-2">
            <p className="text-sm font-medium">Flat reward {formatCurrency(p.yearly.flatReward)}</p>
            <p className="text-xs text-gray-500">unlocked at 100% achievement</p>
          </div>
        )}
      </section>
    </>
  );
}

function LedgerView({ data }: { data: DashboardData }) {
  const p = data.progress!;
  return (
    <>
      <section className="card !p-4">
        <h3 className="font-semibold mb-3">Invoices in this scheme</h3>
        {p.invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No invoices in this scheme period.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {p.invoices.map((iv) => (
              <li key={iv.id} className="py-2.5">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{iv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(iv.invoiceDate)} · due {formatDate(iv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(iv.totalAmount)}</p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        iv.paymentStatus === 'PAID'
                          ? iv.onTime
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                          : iv.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {iv.paymentStatus === 'PAID' ? (iv.onTime ? 'Paid on time' : 'Paid late') : iv.paymentStatus}
                    </span>
                  </div>
                </div>
                {iv.paidAmount > 0 && iv.paidAmount < iv.totalAmount && (
                  <p className="text-xs text-gray-500 mt-1">Paid {formatCurrency(iv.paidAmount)} · balance {formatCurrency(iv.balanceAmount)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card !p-4">
        <h3 className="font-semibold mb-3">Direct sales entries</h3>
        {p.sales.length === 0 ? (
          <p className="text-sm text-gray-500">No direct sales entries in this scheme period.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {p.sales.map((s) => (
              <li key={s.id} className="py-2.5 flex justify-between text-sm">
                <div>
                  <p className="font-medium">{formatDate(s.entryDate)}</p>
                  {s.remarks && <p className="text-xs text-gray-500">{s.remarks}</p>}
                </div>
                <p className="font-medium">{formatCurrency(s.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ProfileView({ data, onLogout }: { data: DashboardData; onLogout: () => void }) {
  const d = data.distributor;
  return (
    <>
      <section className="card !p-4">
        <h3 className="font-semibold mb-3">{d.name}</h3>
        <ul className="text-sm divide-y divide-gray-100">
          <Item label="Phone" value={formatPhone(d.phone)} />
          {d.email && <Item label="Email" value={d.email} />}
          <Item label="Level" value={`${d.levelName} (${d.levelCode})`} />
          {d.gstNumber && <Item label="GST" value={d.gstNumber} />}
          {(d.address || d.city || d.state) && (
            <Item
              label="Address"
              value={[d.address, d.city, d.state, d.pincode].filter(Boolean).join(', ')}
            />
          )}
        </ul>
      </section>
      <button onClick={onLogout} className="btn btn-secondary w-full inline-flex items-center justify-center">
        <LogOut className="w-4 h-4 mr-2" /> Log out
      </button>
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <li className="py-2 flex justify-between gap-3">
      <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </li>
  );
}
