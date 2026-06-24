import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { RefreshCw } from "lucide-react-native";

import { DrawerParamList } from "../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardCard from "../components/DashboardCard";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchApprovalCounts, fetchDashboardCards } from "../redux/slices/dashboardSlice";

type DashboardNav = DrawerNavigationProp<DrawerParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { counts, cards, loading } = useAppSelector((state) => state.dashboard);
  const [refreshing, setRefreshing] = useState(false);

  const allCards = useMemo(
    () => (Array.isArray(cards) ? cards : []),
    [cards],
  );

  const topLevelCards = useMemo(
    () => allCards.filter((card: any) =>
      card.parentId == null && (
        user?.role?.toLowerCase() === 'admin' || user?.permissions?.includes(card.permissionColumn)
      )
    ),
    [allCards, user],
  );

  const childCardsMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const card of allCards) {
      if (card.parentId != null) {
        if (!map[card.parentId]) map[card.parentId] = [];
        map[card.parentId].push(card);
      }
    }
    return map;
  }, [allCards]);

  const displayName = user?.name || "User";

  const getCount = (card: any) => {
    const children = childCardsMap[card.sno];
    if (children?.length) {
      return children.reduce((sum, child) => {
        const permissionCount = Number(counts?.[child.permissionColumn] ?? 0);
        const routeCount = Number(counts?.[child.routeSlug] ?? 0);
        return sum + Math.max(permissionCount, routeCount);
      }, 0);
    }
    const permissionCount = Number(counts?.[card.permissionColumn] ?? 0);
    const routeCount = Number(counts?.[card.routeSlug] ?? 0);
    return Math.max(permissionCount, routeCount);
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchApprovalCounts());
      dispatch(fetchDashboardCards());
      console.log("dashboard screen user", user);
      console.log("dashboard screen counts", counts);
      console.log("dashboard screen cards", cards);
    }, [dispatch]),
  );

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchApprovalCounts()),
      dispatch(fetchDashboardCards()),
    ]);
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
          disabled={refreshing || loading}
          className="flex-row items-center rounded-xl bg-indigo-600 px-4 py-2.5 disabled:opacity-70"
        >
          <RefreshCw size={14} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">
            {refreshing || loading ? "Refreshing" : "Refresh"}
          </Text>
        </Pressable>
      </View>
      <ScrollView className="flex-1 bg-[#f0f0f0]" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {topLevelCards.length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-6">
            <Text className="text-center text-base font-bold text-slate-700">No Cards Available</Text>
            <Text className="mt-1 text-center text-sm font-medium text-slate-500">
              You do not have permission to view any dashboard module.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {topLevelCards.map((card: any) => {
              const count = getCount(card);
              const children = childCardsMap[card.sno];
              const isParent = children?.length > 0;

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
                    if (isParent) {
                      navigation.navigate('SubModule' as any, {
                        parentId: card.sno,
                        title: card.cardTitle,
                      } as any);
                    } else if (count > 0) {
                      navigation.navigate(card.routeSlug as any, {
                        title: card.cardTitle,
                        subtitle: "Review pending requests",
                        routeSlug: card.routeSlug,
                      } as any);
                    } else {
                      Alert.alert("No pending entries", `No pending requests for ${card.cardTitle}`);
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
