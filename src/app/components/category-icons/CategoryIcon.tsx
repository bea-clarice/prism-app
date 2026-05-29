import {
  BookOpen,
  Car,
  Film,
  HeartPulse,
  Home,
  Laptop,
  Lightbulb,
  Plane,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
} from 'lucide-react';
import type { CategoryIconKey } from '../types';

const icons = {
  wallet: Wallet,
  laptop: Laptop,
  utensils: Utensils,
  car: Car,
  film: Film,
  lightbulb: Lightbulb,
  home: Home,
  shopping: ShoppingBag,
  heart: HeartPulse,
  book: BookOpen,
  plane: Plane,
  tag: Tag,
} satisfies Record<CategoryIconKey, typeof Wallet>;

export const CATEGORY_ICON_OPTIONS: { key: CategoryIconKey; label: string }[] = [
  { key: 'wallet', label: 'Wallet' },
  { key: 'laptop', label: 'Work' },
  { key: 'utensils', label: 'Food' },
  { key: 'car', label: 'Transport' },
  { key: 'film', label: 'Fun' },
  { key: 'lightbulb', label: 'Utilities' },
  { key: 'home', label: 'Home' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'heart', label: 'Health' },
  { key: 'book', label: 'Education' },
  { key: 'plane', label: 'Travel' },
  { key: 'tag', label: 'Other' },
];

export function CategoryIcon({ icon, className = 'w-5 h-5' }: { icon: CategoryIconKey; className?: string }) {
  const Icon = icons[icon] || Tag;
  return <Icon className={className} />;
}
