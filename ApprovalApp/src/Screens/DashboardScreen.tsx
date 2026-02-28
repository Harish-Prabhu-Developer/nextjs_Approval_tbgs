import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DASHBOARD_CARDS, MOCK_COUNTS } from '../data/mockData';
import { DrawerParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardCard from '../components/DashboardCard';

type DashboardNav = DrawerNavigationProp<DrawerParamList>;
const USER_DATA_KEY = 'tbgs_user';

const routeMap: Record<string, keyof DrawerParamList> = {
  'purchase-order': 'PurchaseOrder',
  'work-order': 'WorkOrder',
  'price-approval': 'PriceApproval',
  'sales-return-approval': 'SalesReturn',
};

type StoredUser = {
  name?: string;
  permissions?: string[];
};

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardCards, setDashboardCards] = useState(DASHBOARD_CARDS);
  const [displayName, setDisplayName] = useState('User');

  const hydrateUserDashboard = useCallback(async () => {
    try {
      const rawUser = await AsyncStorage.getItem(USER_DATA_KEY);
      const parsedUser: StoredUser | null = rawUser ? JSON.parse(rawUser) : null;
      const allowedPermissions = parsedUser?.permissions || [];

      const filteredCards = DASHBOARD_CARDS.filter((card) =>
        allowedPermissions.includes(card.permissionColumn),
      );

      setDashboardCards(filteredCards);
      setDisplayName(parsedUser?.name || 'User');
    } catch {
      setDashboardCards([]);
      setDisplayName('User');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void hydrateUserDashboard();
    }, [hydrateUserDashboard]),
  );

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    await hydrateUserDashboard();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#f0f0f0] px-4 pt-4 pb-2">
      <View className="mb-6 flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-[30px] font-black leading-9 text-slate-900">Dashboard</Text>
          <Text className="mt-1 pr-2 text-sm font-semibold leading-5 text-slate-500">
            Overview of pending approvals for {displayName}
          </Text>
        </View>
        <Pressable
          onPress={handleRefresh}
          disabled={refreshing}
          className="flex-row items-center rounded-xl bg-indigo-600 px-4 py-2.5 disabled:opacity-70"
        >
          <RefreshCw size={14} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">{refreshing ? 'Refreshing' : 'Refresh'}</Text>
        </Pressable>
      </View>
      <ScrollView className="flex-1 bg-[#f0f0f0]" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {dashboardCards.length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-6">
            <Text className="text-center text-base font-bold text-slate-700">No Cards Available</Text>
            <Text className="mt-1 text-center text-sm font-medium text-slate-500">
              You do not have permission to view any dashboard module.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {dashboardCards.map((card) => {
              const count = MOCK_COUNTS[card.permissionColumn] || 0;

              return (
                <DashboardCard
                  key={card.sno}
                  card={{
                    id: card.sno,
                    title: card.cardTitle,
                    value: count,
                    iconKey: card.iconKey,
                    backgroundColor: card.backgroundColor,
                  }}
                  onPress={() => {
                    if (count > 0) {
                      const routeName = routeMap[card.routeSlug];
                      if (routeName) {
                        navigation.navigate(routeName as any, {
                          title: card.cardTitle,
                          subtitle: 'Review pending requests',
                          routeSlug: card.routeSlug,
                        } as any);
                      }
                    } else {
                      Alert.alert('No pending entries', `No pending requests for ${card.cardTitle}`);
                    }
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
