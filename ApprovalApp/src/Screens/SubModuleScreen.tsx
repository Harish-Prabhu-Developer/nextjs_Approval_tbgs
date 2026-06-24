import React, { useMemo } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DashboardCard from "../components/DashboardCard";
import { useAppSelector } from "../redux/hooks";
import { DrawerParamList } from "../navigation/types";

type SubModuleRoute = RouteProp<{ SubModule: { parentId: number; title: string } }, "SubModule">;

export default function SubModuleScreen() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const route = useRoute<SubModuleRoute>();
  const insets = useSafeAreaInsets();
  const { parentId, title } = route.params;
  const { cards, counts } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  const childCards = useMemo(
    () => (Array.isArray(cards) ? cards : []).filter(
      (card: any) => card.parentId === parentId
    ),
    [cards, parentId],
  );

  const allowedCards = useMemo(
    () => childCards.filter((card: any) =>
      user?.role?.toLowerCase() === 'admin' || user?.permissions?.includes(card.permissionColumn)
    ),
    [childCards, user],
  );

  const getCount = (card: any) => {
    const permissionCount = Number(counts?.[card.permissionColumn] ?? 0);
    const routeCount = Number(counts?.[card.routeSlug] ?? 0);
    return Math.max(permissionCount, routeCount);
  };

  return (
    <View className="flex-1 bg-[#f0f0f0] px-4 pt-4 pb-2">
      <View className="mb-6">
        <Text className="text-[30px] font-black leading-9 text-slate-900">{title}</Text>
        <Text className="mt-1 text-sm font-semibold leading-5 text-slate-500">
          Select a category to review pending requests
        </Text>
      </View>
      <ScrollView className="flex-1 bg-[#f0f0f0]" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {allowedCards.length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-6">
            <Text className="text-center text-base font-bold text-slate-700">No Sub-Modules Available</Text>
            <Text className="mt-1 text-center text-sm font-medium text-slate-500">
              You do not have permission to view any sub-module.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {allowedCards.map((card: any) => {
              const count = getCount(card);

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
