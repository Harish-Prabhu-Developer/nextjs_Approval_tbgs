import React from 'react';
import { Text, View } from 'react-native';

interface ModuleScreenProps {
  title: string;
  subtitle: string;
}

export default function ModuleScreen({ title, subtitle }: ModuleScreenProps) {
  return (
    <View className="flex-1 bg-slate-50 px-4 py-6">
      <View className="rounded-2xl border border-slate-200 bg-white p-5">
        <Text className="text-2xl font-black text-slate-900">{title}</Text>
        <Text className="mt-1 text-sm font-medium text-slate-500">{subtitle}</Text>
      </View>
    </View>
  );
}
