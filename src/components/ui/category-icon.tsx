import React from "react";
import {
  Utensils,
  BookOpen,
  Home,
  Laptop,
  Coffee,
  Bus,
  Film,
  Tag,
  Gift,
  DollarSign,
  Wallet,
  Music,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  GraduationCap,
  Briefcase,
  Award,
  Zap,
  Phone,
  Car,
  Plane,
  Dumbbell,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Utensils,
  BookOpen,
  Home,
  Laptop,
  Coffee,
  Bus,
  Film,
  Tag,
  Gift,
  DollarSign,
  Wallet,
  Music,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  GraduationCap,
  Briefcase,
  Award,
  Zap,
  Phone,
  Car,
  Plane,
  Dumbbell,
  ShieldCheck,
};

export const AVAILABLE_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#F59E0B", // Amber
  "#F97316", // Orange
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#64748B", // Slate
  "#84CC16", // Lime
];

interface CategoryIconProps {
  name?: string;
  className?: string;
  color?: string;
  size?: number;
}

export function CategoryIcon({
  name = "Tag",
  className = "h-4 w-4",
  color,
  size,
}: CategoryIconProps) {
  const IconComponent = CATEGORY_ICONS[name] || Tag;
  return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
}
