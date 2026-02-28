import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BriefcaseBusiness, LayoutDashboard, ShoppingCart } from 'lucide-react-native';

type CardInput = {
  id: number;
  title: string;
  value: number;
  iconKey: string;
  backgroundColor?: string;
};

interface DashboardCardProps {
  card: CardInput;
  onPress: () => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  ShoppingCart,
  Briefcase: BriefcaseBusiness,
  LayoutDashboard,
};

const bgColorMap: Record<string, { wrapper: string; icon: string }> = {
  indigo: { wrapper: 'bg-indigo-50', icon: '#4F46E5' },
  emerald: { wrapper: 'bg-emerald-50', icon: '#059669' },
  amber: { wrapper: 'bg-amber-50', icon: '#D97706' },
  rose: { wrapper: 'bg-rose-50', icon: '#E11D48' },
  blue: { wrapper: 'bg-blue-50', icon: '#2563EB' },
  purple: { wrapper: 'bg-purple-50', icon: '#7C3AED' },
  orange: { wrapper: 'bg-orange-50', icon: '#EA580C' },
  cyan: { wrapper: 'bg-cyan-50', icon: '#0891B2' },
  pink: { wrapper: 'bg-pink-50', icon: '#DB2777' },
  teal: { wrapper: 'bg-teal-50', icon: '#0D9488' },
  red: { wrapper: 'bg-red-50', icon: '#DC2626' },
  violet: { wrapper: 'bg-violet-50', icon: '#7C3AED' },
  sky: { wrapper: 'bg-sky-50', icon: '#0284C7' },
  lime: { wrapper: 'bg-lime-50', icon: '#65A30D' },
  fuchsia: { wrapper: 'bg-fuchsia-50', icon: '#C026D3' },
};

export default function DashboardCard({ card, onPress }: DashboardCardProps) {
  const Icon = iconMap[card.iconKey] || LayoutDashboard;
  const colors = bgColorMap[card.backgroundColor || 'indigo'] || bgColorMap.indigo;

  return (
    <Pressable
      onPress={onPress}
      className="relative mb-4 w-[48%] overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:opacity-80"
    >
      <View className="absolute left-0 right-0 top-0 h-1 rounded-t-xl bg-indigo-600" />

      <View className="items-center pt-1">
        <View className={`mb-3 rounded-full p-3 ${colors.wrapper}`}>
          <Icon size={22} color={colors.icon} />
        </View>

        <Text className="min-h-[36px] text-center text-[11px] font-bold uppercase tracking-wide text-gray-700">
          {card.title}
        </Text>

        <Text className="mt-2 text-3xl font-black text-indigo-600">{card.value}</Text>

        {card.value > 0 ? (
          <View className="mt-2 rounded-full bg-emerald-100 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-emerald-700">{card.value} Pending</Text>
          </View>
        ) : (
          <View className="mt-2 rounded-full bg-gray-100 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-gray-600">No Pending</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
