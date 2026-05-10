'use client';

import { Home, Target, Gift, ScrollText, User } from 'lucide-react';

export type DealerView = 'home' | 'targets' | 'rewards' | 'ledger' | 'profile';

const TABS: Array<{ id: DealerView; label: string; icon: any }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'ledger', label: 'Ledger', icon: ScrollText },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function MobileBottomNav({ view, onChange }: { view: DealerView; onChange: (v: DealerView) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-5 max-w-screen-sm mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs ${
                active ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={active ? 'font-medium' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
