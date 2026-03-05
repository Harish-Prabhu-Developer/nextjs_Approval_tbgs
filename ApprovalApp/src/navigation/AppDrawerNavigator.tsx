import React, { useCallback, useMemo } from 'react';
import { Alert, Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView, createDrawerNavigator, useDrawerStatus } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Bell, BriefcaseBusiness, LayoutDashboard, LogOut, Menu, ShoppingCart, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Breadcrumbs from '../components/Breadcrumbs';

import { DASHBOARD_CARDS } from '../data/mockData';
import DashboardScreen from '../Screens/DashboardScreen';
import ApprovalScreen from '../Screens/ApprovalScreen';
import { DrawerParamList } from './types';
import ViewDetailScreen from '../Screens/ViewDetailScreen';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchApprovalCounts } from '../redux/slices/dashboardSlice';
import { logoutUser } from '../redux/slices/authSlice';

const Drawer = createDrawerNavigator<DrawerParamList>();

type DrawerMenuItem = {
  key: keyof DrawerParamList;
  label: string;
  count: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

type ModuleConfig = {
  key: keyof DrawerParamList;
  title: string;
  subtitle: string;
  routeSlug: string;
  permissionColumn: string;
};

const routeMap: Record<string, keyof DrawerParamList> = {
  'purchase-order': 'PurchaseOrder',
  'work-order': 'WorkOrder',
  'price-approval': 'PriceApproval',
  'sales-return-approval': 'SalesReturn',
};

const iconMap: Record<string, DrawerMenuItem['icon']> = {
  ShoppingCart,
  Briefcase: BriefcaseBusiness,
  LayoutDashboard,
};

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    key: 'PurchaseOrder',
    title: 'Purchase Order Approvals',
    subtitle: 'Review purchase order requests and action pending entries',
    routeSlug: 'purchase-order',
    permissionColumn: 'poApproval',
  },
  {
    key: 'WorkOrder',
    title: 'Work Order Approvals',
    subtitle: 'Validate and manage work order approval requests',
    routeSlug: 'work-order',
    permissionColumn: 'workOrderApproval',
  },
  {
    key: 'PriceApproval',
    title: 'Price Approvals',
    subtitle: 'Approve pricing changes and commercial exceptions',
    routeSlug: 'price-approval',
    permissionColumn: 'priceApproval',
  },
  {
    key: 'SalesReturn',
    title: 'Sales Return Approvals',
    subtitle: 'Process sales return authorization requests',
    routeSlug: 'sales-return-approval',
    permissionColumn: 'salesReturnApproval',
  },
];

function SidebarContent(
  props: DrawerContentComponentProps & {
    onLogout: () => void;
    allowedPermissions: string[];
    userName: string;
    counts: Record<string, number>;
  },
) {
  const { navigation, state, onLogout, allowedPermissions, userName, counts } = props;
  const insets = useSafeAreaInsets();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    NavigationBar.setButtonStyleAsync(isDrawerOpen ? 'light' : 'dark').catch(() => {
      // Older Android variants may not support dynamic nav button styles.
    });
  }, [isDrawerOpen]);

  const getPendingCount = (permissionColumn: string, routeSlug: string) => {
    const permissionCount = Number(counts?.[permissionColumn] ?? 0);
    const routeCount = Number(counts?.[routeSlug] ?? 0);
    return Math.max(permissionCount, routeCount);
  };

  const menuItems: DrawerMenuItem[] = [
    {
      key: 'Dashboard',
      label: 'Dashboard',
      count: 0,
      icon: LayoutDashboard,
    },
    ...DASHBOARD_CARDS.filter((card) => allowedPermissions.includes(card.permissionColumn)).map((card) => ({
      key: routeMap[card.routeSlug] || 'Dashboard',
      label: card.cardTitle,
      count: getPendingCount(card.permissionColumn, card.routeSlug),
      icon: iconMap[card.iconKey] || LayoutDashboard,
    })),
  ];

  return (
    <>
      <StatusBar style={drawerStatus === 'open' ? 'light' : 'dark'} />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
        scrollEnabled={false}
      >
        <View className="flex-1 px-3 py-4">
          {/* HEADER */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <Text className="text-xl font-black text-white">{(userName.charAt(0) || 'u').toLowerCase()}</Text>
              </View>
              <View>
                <Text className="text-2xl font-black text-white">VIT Hub</Text>
                <Text className="text-[11px] font-bold uppercase tracking-wide text-indigo-200">Control Panel</Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.closeDrawer()}
              className="h-8 w-8 items-center justify-center rounded-lg bg-white/10"
            >
              <X size={18} color="#E2E8F0" />
            </Pressable>
          </View>

          <View className="h-px bg-white/10 mb-4" />

          {/* MENU ITEMS */}
          <View className="flex-1 gap-2">
            {menuItems.map((item) => {
              const index = state.routeNames.indexOf(item.key);
              const focused = state.index === index;
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    if (item.key === 'Dashboard') {
                      navigation.navigate('Dashboard');
                      return;
                    }

                    if (item.count <= 0) {
                      Alert.alert('No pending entries', `No pending requests for ${item.label}`);
                      return;
                    }

                    const config = MODULE_CONFIGS.find((m) => m.key === item.key);
                    navigation.navigate(item.key as any, {
                      title: config?.title || item.label,
                      subtitle: config?.subtitle,
                      routeSlug: config?.routeSlug,
                    });
                  }}
                  className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${focused ? 'bg-white/15' : 'bg-transparent'}`}
                >
                  <View className="flex-row items-center">
                    <Icon size={19} color={focused ? '#FFFFFF' : '#C7D2FE'} strokeWidth={2.2} />
                    <Text className={`ml-3 text-base font-extrabold ${focused ? 'text-white' : 'text-indigo-100'}`}>
                      {item.label}
                    </Text>
                  </View>
                  {item.count > 0 && (
                    <View className="h-7 min-w-7 items-center justify-center rounded-full bg-rose-500 px-2">
                      <Text className="text-xs font-black text-white">{item.count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View className="h-px bg-white/10 my-4" />

          {/* LOGOUT */}
          <Pressable
            onPress={onLogout}
            className="flex-row items-center rounded-xl bg-red-500/10 px-3 py-3"
          >
            <LogOut size={20} color="#F43F5E" />
            <Text className="ml-3 text-lg font-black text-rose-400">Sign Out</Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>
    </>
  );
}

export default function AppDrawerNavigator() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { counts } = useAppSelector((state) => state.dashboard);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const permanent = width >= 1024;
  const userName = user?.name || 'User';
  const allowedPermissions = user?.permissions || [];

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchApprovalCounts());
    }, [dispatch]),
  );

  const allowedModules = useMemo(
    () => MODULE_CONFIGS.filter((item) => allowedPermissions.includes(item.permissionColumn)),
    [allowedPermissions],
  );

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <LinearGradient
          colors={['#4338CA', '#312E81', '#1F1B5D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <SidebarContent
            {...props}
            onLogout={() => {
              dispatch(logoutUser());
            }}
            allowedPermissions={allowedPermissions}
            userName={userName}
            counts={counts}
          />
        </LinearGradient>
      )}
      screenOptions={{
        headerShown: !permanent,
        header: ({ navigation, route }) => {
          if (permanent) return null;
          return (
            <View className="bg-white border-b border-slate-100 shadow-sm" style={{ paddingTop: Math.max(insets.top, 10) }}>
              {/* Top Row: Navigation, Logo, Profile */}
              <View className="flex-row items-center justify-between px-4 h-16">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => (navigation as any).openDrawer()}
                    className="p-2 mr-3 rounded-xl hover:bg-slate-100"
                  >
                    <Menu size={22} color="#475569" />
                  </Pressable>

                  <View className="h-10 w-px bg-slate-200 ml-1 mr-4" />

                  <Image
                    source={{ uri: 'https://visioninfotech.co.tz/assets/images/vit-logo-dark.png' }}
                    style={{ width: 140, height: 40 }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-row items-center gap-3">
                  <Pressable className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                    <Bell size={18} color="#475569" />
                  </Pressable>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#8E78FF] shadow-sm">
                    <Text className="text-sm font-black text-white">{(userName.charAt(0) || 'U').toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Row: Breadcrumbs */}
              {route.name !== 'Dashboard' && (
                <View className="border-t border-slate-100">
                  <Breadcrumbs />
                </View>
              )}
            </View>
          );
        },
        drawerType: permanent ? 'permanent' : 'front',
        drawerStyle: {
          width: 320,
          backgroundColor: 'transparent',
        },
        overlayColor: 'rgba(15,23,42,0.45)',
        sceneStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      {allowedModules.map((module) => (
        <Drawer.Screen
          key={module.key}
          name={module.key}
          options={{ title: module.title }}
          component={ApprovalScreen}
          initialParams={{
            title: module.title,
            subtitle: module.subtitle,
            routeSlug: module.routeSlug,
          }}
        />
      ))}
      <Drawer.Screen
        name="ViewDetail"
        component={ViewDetailScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}
