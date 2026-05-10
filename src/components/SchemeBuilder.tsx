'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2, AlertCircle } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  code: string;
  priority: number;
  isActive: boolean;
}
interface Category {
  id: string;
  name: string;
  code: string;
  weightage: number;
  isActive: boolean;
}

interface RewardTier {
  at: number;
  reward: string;
}

interface LevelConfig {
  distributorLevelId: string;
  enabled: boolean;
  name: string;
  q1Target: number;
  q2Target: number;
  q3Target: number;
  q4Target: number;
  yearlyTarget: number;
  yearlyReward: number;
  maxCreditDays: number;
  quarterlyRewardTiers: RewardTier[];
  yearlyRewardTiers: RewardTier[];
}
interface CategoryConfig {
  itemCategoryId: string;
  enabled: boolean;
  weight: number;
  minMix: number;
  reward: string;
}

interface ExistingScheme {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  allowOverlap: boolean;
  schemeLevels: Array<{
    distributorLevelId: string;
    name: string;
    q1Target: number;
    q2Target: number;
    q3Target: number;
    q4Target: number;
    yearlyTarget: number;
    yearlyReward: number;
    maxCreditDays: number;
    quarterlyRewardTiers: unknown;
    yearlyRewardTiers: unknown;
  }>;
  schemeCategories: Array<{
    itemCategoryId: string;
    weight: number;
    minMix: number;
    reward: string | null;
  }>;
}

function isoDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function tiersToText(tiers: RewardTier[]): string {
  return tiers.map((t) => `${t.at}: ${t.reward}`).join('\n');
}

function textToTiers(text: string): RewardTier[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { at: Number(line), reward: '' };
      return {
        at: Number(line.slice(0, idx).trim()),
        reward: line.slice(idx + 1).trim(),
      };
    })
    .filter((t) => Number.isFinite(t.at) && t.at > 0)
    .sort((a, b) => a.at - b.at);
}

function normalizeTiers(input: unknown): RewardTier[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((t: any) => ({ at: Number(t?.at), reward: String(t?.reward ?? '') }))
    .filter((t) => Number.isFinite(t.at) && t.at > 0)
    .sort((a, b) => a.at - b.at);
}

export default function SchemeBuilder({ existing }: { existing?: ExistingScheme }) {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<Array<{ name: string }>>([]);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [startDate, setStartDate] = useState(existing ? isoDate(existing.startDate) : '');
  const [endDate, setEndDate] = useState(existing ? isoDate(existing.endDate) : '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [allowOverlap, setAllowOverlap] = useState(existing?.allowOverlap ?? false);

  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([]);
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);

  // Load levels and categories, build initial configs
  useEffect(() => {
    (async () => {
      const [lRes, cRes] = await Promise.all([
        fetch('/api/admin/levels'),
        fetch('/api/admin/categories'),
      ]);
      const lData = await lRes.json();
      const cData = await cRes.json();
      const ls: Level[] = (lData.levels || []).filter((l: Level) => l.isActive);
      const cs: Category[] = (cData.categories || []).filter((c: Category) => c.isActive);
      setLevels(ls);
      setCategories(cs);
      setLevelConfigs(
        ls.map((l) => {
          const present = existing?.schemeLevels.find((sl) => sl.distributorLevelId === l.id);
          return {
            distributorLevelId: l.id,
            enabled: !!present,
            name: present?.name ?? `${l.name} Target`,
            q1Target: present?.q1Target ?? 0,
            q2Target: present?.q2Target ?? 0,
            q3Target: present?.q3Target ?? 0,
            q4Target: present?.q4Target ?? 0,
            yearlyTarget: present?.yearlyTarget ?? 0,
            yearlyReward: present?.yearlyReward ?? 0,
            maxCreditDays: present?.maxCreditDays ?? 30,
            quarterlyRewardTiers: normalizeTiers(present?.quarterlyRewardTiers),
            yearlyRewardTiers: normalizeTiers(present?.yearlyRewardTiers),
          };
        }),
      );
      setCategoryConfigs(
        cs.map((c) => {
          const present = existing?.schemeCategories.find((sc) => sc.itemCategoryId === c.id);
          return {
            itemCategoryId: c.id,
            enabled: !!present,
            weight: present?.weight ?? Math.round(c.weightage * 100),
            minMix: present?.minMix ?? 0,
            reward: present?.reward ?? '',
          };
        }),
      );
      setLoading(false);
    })();
  }, [existing]);

  const updateLevel = (id: string, patch: Partial<LevelConfig>) => {
    setLevelConfigs((prev) => prev.map((l) => (l.distributorLevelId === id ? { ...l, ...patch } : l)));
  };
  const updateCategory = (id: string, patch: Partial<CategoryConfig>) => {
    setCategoryConfigs((prev) => prev.map((c) => (c.itemCategoryId === id ? { ...c, ...patch } : c)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConflicts([]);

    const enabledLevels = levelConfigs.filter((l) => l.enabled);
    if (!enabledLevels.length) {
      setError('Mark at least one distributor level as eligible.');
      return;
    }
    const enabledCategories = categoryConfigs.filter((c) => c.enabled);

    setSaving(true);
    try {
      const body = {
        name,
        description: description || null,
        startDate,
        endDate,
        isActive,
        allowOverlap,
        levels: enabledLevels.map((l) => ({
          distributorLevelId: l.distributorLevelId,
          name: l.name,
          q1Target: l.q1Target,
          q2Target: l.q2Target,
          q3Target: l.q3Target,
          q4Target: l.q4Target,
          yearlyTarget: l.yearlyTarget,
          yearlyReward: l.yearlyReward,
          maxCreditDays: l.maxCreditDays,
          quarterlyRewardTiers: l.quarterlyRewardTiers,
          yearlyRewardTiers: l.yearlyRewardTiers,
        })),
        categories: enabledCategories.map((c) => ({
          itemCategoryId: c.itemCategoryId,
          weight: c.weight,
          minMix: c.minMix,
          reward: c.reward || null,
        })),
      };
      const url = existing ? `/api/admin/schemes/${existing.id}` : '/api/admin/schemes';
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save scheme');
        if (data.conflicts) setConflicts(data.conflicts);
        return;
      }
      router.push('/admin/schemes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading…</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            {conflicts.length > 0 && (
              <p className="text-sm mt-1">Conflicting schemes: {conflicts.map((c) => c.name).join(', ')}</p>
            )}
          </div>
        </div>
      )}

      <section className="card">
        <h2 className="font-semibold mb-4">Scheme details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="e.g. Annual Scheme 2025-26" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start date *</label>
            <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End date *</label>
            <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mr-2" />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" checked={allowOverlap} onChange={(e) => setAllowOverlap(e.target.checked)} className="mr-2" />
              <span className="text-sm">Allow overlap with other schemes (dual-scheme mode)</span>
            </label>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-1">Item categories</h2>
        <p className="text-sm text-gray-600 mb-4">
          Pick which categories count for this scheme, with weight (% multiplier on sales) and minimum mix (% of total sales required to unlock).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-2 py-2">Include</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2 w-24">Weight %</th>
                <th className="px-2 py-2 w-24">Min mix %</th>
                <th className="px-2 py-2">Category reward note</th>
              </tr>
            </thead>
            <tbody>
              {categoryConfigs.map((c) => {
                const cat = categories.find((x) => x.id === c.itemCategoryId);
                return (
                  <tr key={c.itemCategoryId} className="border-t">
                    <td className="px-2 py-2">
                      <input type="checkbox" checked={c.enabled} onChange={(e) => updateCategory(c.itemCategoryId, { enabled: e.target.checked })} />
                    </td>
                    <td className="px-2 py-2 font-medium">{cat?.name}</td>
                    <td className="px-2 py-2">
                      <input type="number" min={0} value={c.weight} onChange={(e) => updateCategory(c.itemCategoryId, { weight: Number(e.target.value) })} className="input w-full" disabled={!c.enabled} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min={0} max={100} value={c.minMix} onChange={(e) => updateCategory(c.itemCategoryId, { minMix: Number(e.target.value) })} className="input w-full" disabled={!c.enabled} />
                    </td>
                    <td className="px-2 py-2">
                      <input value={c.reward} onChange={(e) => updateCategory(c.itemCategoryId, { reward: e.target.value })} className="input w-full" placeholder="Optional reward unlocked when mix met" disabled={!c.enabled} />
                    </td>
                  </tr>
                );
              })}
              {categoryConfigs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                    No item categories defined. Add some on the Categories page first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-1">Distributor levels</h2>
        <p className="text-sm text-gray-600 mb-4">
          For each eligible level set quarterly targets (timely-payment based) and yearly target (weighted-sales based). Reward tiers: one per line as <code>percent: reward text</code>, e.g. <code>80: Voucher 10k</code>.
        </p>
        <div className="space-y-4">
          {levelConfigs.map((l) => {
            const lvl = levels.find((x) => x.id === l.distributorLevelId);
            return (
              <div key={l.distributorLevelId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="inline-flex items-center font-medium">
                    <input type="checkbox" checked={l.enabled} onChange={(e) => updateLevel(l.distributorLevelId, { enabled: e.target.checked })} className="mr-2" />
                    {lvl?.name} <span className="text-xs text-gray-500 ml-2">({lvl?.code})</span>
                  </label>
                </div>
                {l.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tier name</label>
                      <input value={l.name} onChange={(e) => updateLevel(l.distributorLevelId, { name: e.target.value })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max credit days</label>
                      <input type="number" min={0} value={l.maxCreditDays} onChange={(e) => updateLevel(l.distributorLevelId, { maxCreditDays: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Yearly target ₹</label>
                      <input type="number" min={0} value={l.yearlyTarget} onChange={(e) => updateLevel(l.distributorLevelId, { yearlyTarget: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Yearly flat reward ₹</label>
                      <input type="number" min={0} value={l.yearlyReward} onChange={(e) => updateLevel(l.distributorLevelId, { yearlyReward: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Q1 target ₹</label>
                      <input type="number" min={0} value={l.q1Target} onChange={(e) => updateLevel(l.distributorLevelId, { q1Target: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Q2 target ₹</label>
                      <input type="number" min={0} value={l.q2Target} onChange={(e) => updateLevel(l.distributorLevelId, { q2Target: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Q3 target ₹</label>
                      <input type="number" min={0} value={l.q3Target} onChange={(e) => updateLevel(l.distributorLevelId, { q3Target: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Q4 target ₹</label>
                      <input type="number" min={0} value={l.q4Target} onChange={(e) => updateLevel(l.distributorLevelId, { q4Target: Number(e.target.value) })} className="input w-full" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Quarterly reward tiers</label>
                      <textarea
                        rows={3}
                        value={tiersToText(l.quarterlyRewardTiers)}
                        onChange={(e) => updateLevel(l.distributorLevelId, { quarterlyRewardTiers: textToTiers(e.target.value) })}
                        className="input w-full font-mono text-xs"
                        placeholder={'80: Voucher 10k\n100: Trip\n120: Family holiday'}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Yearly reward tiers</label>
                      <textarea
                        rows={3}
                        value={tiersToText(l.yearlyRewardTiers)}
                        onChange={(e) => updateLevel(l.distributorLevelId, { yearlyRewardTiers: textToTiers(e.target.value) })}
                        className="input w-full font-mono text-xs"
                        placeholder={'85: Priority rebate\n100: BD fund 4L\n125: Car support'}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {levelConfigs.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No distributor levels defined. Add some on the Levels page first.</p>
          )}
        </div>
      </section>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary inline-flex items-center disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Create scheme'}
        </button>
        <button type="button" onClick={() => router.push('/admin/schemes')} className="btn btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
