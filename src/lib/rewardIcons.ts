import {
  Smartphone,
  Car,
  Bike,
  Plane,
  Tv,
  Gift,
  Trophy,
  Award,
  Watch,
  Laptop,
  Headphones,
  Gamepad2,
  Camera,
  Refrigerator,
  Sofa,
  Wallet,
  CreditCard,
  ShoppingBag,
  Star,
  Crown,
  type LucideIcon,
} from 'lucide-react';

/**
 * The fixed catalog of icons admins can pick for rewards.
 * Order roughly by popularity for paint-distributor rewards.
 */
export const REWARD_ICONS: Array<{ value: string; label: string; Icon: LucideIcon }> = [
  { value: 'smartphone', label: 'Phone', Icon: Smartphone },
  { value: 'car', label: 'Car', Icon: Car },
  { value: 'bike', label: 'Bike', Icon: Bike },
  { value: 'plane', label: 'Travel / Trip', Icon: Plane },
  { value: 'tv', label: 'TV', Icon: Tv },
  { value: 'laptop', label: 'Laptop', Icon: Laptop },
  { value: 'watch', label: 'Watch', Icon: Watch },
  { value: 'headphones', label: 'Headphones', Icon: Headphones },
  { value: 'camera', label: 'Camera', Icon: Camera },
  { value: 'gamepad', label: 'Gaming', Icon: Gamepad2 },
  { value: 'refrigerator', label: 'Appliance', Icon: Refrigerator },
  { value: 'sofa', label: 'Furniture', Icon: Sofa },
  { value: 'wallet', label: 'Voucher / Cash', Icon: Wallet },
  { value: 'card', label: 'Gift card', Icon: CreditCard },
  { value: 'bag', label: 'Shopping', Icon: ShoppingBag },
  { value: 'gift', label: 'Gift', Icon: Gift },
  { value: 'trophy', label: 'Trophy', Icon: Trophy },
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'crown', label: 'Crown', Icon: Crown },
];

export function iconFor(name?: string | null): LucideIcon {
  return REWARD_ICONS.find((i) => i.value === name)?.Icon ?? Gift;
}

export interface RewardItem {
  name: string;
  imageUrl?: string | null;
  icon?: string | null;
  description?: string | null;
}

export type RewardPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'YEARLY';
export const REWARD_PERIODS: RewardPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4', 'YEARLY'];

export interface RewardsMap {
  Q1?: RewardItem;
  Q2?: RewardItem;
  Q3?: RewardItem;
  Q4?: RewardItem;
  YEARLY?: RewardItem;
}

export function parseRewardsField(input: unknown): RewardsMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const map: RewardsMap = {};
  for (const period of REWARD_PERIODS) {
    const value = (input as any)[period];
    if (!value || typeof value !== 'object') continue;
    const name = String(value.name ?? '').trim();
    if (!name) continue;
    map[period] = {
      name,
      imageUrl: value.imageUrl ? String(value.imageUrl) : null,
      icon: value.icon ? String(value.icon) : null,
      description: value.description ? String(value.description) : null,
    };
  }
  return map;
}
