import React, { useCallback, useMemo } from 'react';
import { Alert, Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView, createDrawerNavigator, useDrawerStatus } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Bell, BriefcaseBusiness, Camera, ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, MessageSquare, ShoppingCart, X, FileText, Bookmark, DollarSign, Users, Package, Truck, BookOpen, User, Zap, Database, Building2, TrendingUp, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureScreen } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Breadcrumbs from '../components/Breadcrumbs';

import DashboardScreen from '../Screens/DashboardScreen';
import SubModuleScreen from '../Screens/SubModuleScreen';
import ApprovalScreen from '../Screens/ApprovalScreen';
import { DrawerParamList } from './types';
import ViewDetailScreen from '../Screens/ViewDetailScreen';
import ChatListScreen from '../Screens/ChatListScreen';
import ChatDetailScreen from '../Screens/ChatDetailScreen';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchApprovalCounts, fetchDashboardCards } from '../redux/slices/dashboardSlice';
import { logoutUser } from '../redux/slices/authSlice';

const Drawer = createDrawerNavigator<DrawerParamList>();

type DrawerMenuItem = {
  key: string;
  label: string;
  count: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const iconMap: Record<string, DrawerMenuItem['icon']> = {
  ShoppingCart,
  Briefcase: BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  Bookmark,
  DollarSign,
  Users,
  Package,
  Truck,
  Book: BookOpen,
  User,
  Zap,
  Database,
  Building2,
  TrendingUp,
  RotateCcw,
};

function SidebarContent(
  props: DrawerContentComponentProps & {
    onLogout: () => void;
    allowedCards: any[];
    allCards: any[];
    userName: string;
    counts: Record<string, number>;
  },
) {
  const { navigation, state, onLogout, allowedCards, allCards, userName, counts } = props;
  const insets = useSafeAreaInsets();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';
  const [expandedParents, setExpandedParents] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync(isDrawerOpen ? 'light' : 'dark').catch(() => {});
  }, [isDrawerOpen]);

  const getCount = (permissionColumn: string, routeSlug: string) => {
    const permissionCount = Number(counts?.[permissionColumn] ?? 0);
    const routeCount = Number(counts?.[routeSlug] ?? 0);
    return Math.max(permissionCount, routeCount);
  };

  const parentCards = allowedCards.filter((card: any) => {
    const hasChildren = allCards.some((c: any) => c.parentId === card.sno);
    return hasChildren;
  });
  const topLeafCards = allowedCards.filter((card: any) => {
    const hasChildren = allCards.some((c: any) => c.parentId === card.sno);
    return !hasChildren && card.parentId == null;
  });

  const menuItems: DrawerMenuItem[] = [
    { key: 'Dashboard', label: 'Dashboard', count: 0, icon: LayoutDashboard },
    { key: 'ChatList', label: 'Messages', count: 0, icon: MessageSquare },
    ...parentCards.map((card: any) => ({
      key: card.routeSlug,
      label: card.cardTitle,
      count: 0,
      icon: iconMap[card.iconKey] || LayoutDashboard,
      parentSno: card.sno,
    })),
    ...topLeafCards.map((card: any) => ({
      key: card.routeSlug,
      label: card.cardTitle,
      count: getCount(card.permissionColumn, card.routeSlug),
      icon: iconMap[card.iconKey] || LayoutDashboard,
    })),
  ];

  const childCardsMap = React.useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const card of allCards) {
      if (card.parentId != null) {
        if (!map[card.parentId]) map[card.parentId] = [];
        map[card.parentId].push(card);
      }
    }
    return map;
  }, [allCards]);

  const toggleParent = (sno: number) => {
    setExpandedParents(prev => ({ ...prev, [sno]: !prev[sno] }));
  };

  const getParentCount = (parentSno: number) => {
    const children = childCardsMap[parentSno];
    if (!children) return 0;
    return children.reduce((sum, child) => {
      return sum + getCount(child.permissionColumn, child.routeSlug);
    }, 0);
  };

  return (
    <>
      <StatusBar style={drawerStatus === 'open' ? 'light' : 'dark'} />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-3 py-4">
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

          <View className="flex-1 gap-1">
            {menuItems.map((item) => {
              const isParent = 'parentSno' in item && item.parentSno != null;
              const index = state.routeNames.indexOf(item.key);
              const focused = state.index === index;
              const Icon = item.icon;
              const parentSno = (item as any).parentSno as number | undefined;
              const isExpanded = parentSno != null ? expandedParents[parentSno] : false;
              const children = parentSno != null ? childCardsMap[parentSno] || [] : [];
              const parentCount = parentSno != null ? getParentCount(parentSno) : 0;

              return (
                <React.Fragment key={`group-${item.key}`}>
                  <Pressable
                    onPress={() => {
                      if (isParent) {
                        if (parentSno != null) toggleParent(parentSno);
                        return;
                      }
                      if (item.key === 'Dashboard' || item.key === 'ChatList') {
                        navigation.navigate(item.key as any);
                        return;
                      }
                      if (item.count <= 0) {
                        Alert.alert('No pending entries', `No pending requests for ${item.label}`);
                        return;
                      }
                      navigation.navigate(item.key as any, {
                        title: item.label,
                        subtitle: 'Review pending requests',
                        routeSlug: item.key,
                      });
                    }}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${focused ? 'bg-white/15' : 'bg-transparent'}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <Icon size={19} color={focused ? '#FFFFFF' : '#C7D2FE'} strokeWidth={2.2} />
                      <Text
                        className={`ml-3 flex-1 text-base font-extrabold ${focused ? 'text-white' : 'text-indigo-100'}`}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isParent ? (
                      <View className="flex-row items-center gap-2">
                        {parentCount > 0 && (
                          <View className="h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5">
                            <Text className="text-xs font-black text-white">{parentCount}</Text>
                          </View>
                        )}
                        {isExpanded ? (
                          <ChevronDown size={16} color="#C7D2FE" />
                        ) : (
                          <ChevronRight size={16} color="#C7D2FE" />
                        )}
                      </View>
                    ) : (
                      item.count > 0 && (
                        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5">
                          <Text className="text-xs font-black text-white">{item.count}</Text>
                        </View>
                      )
                    )}
                  </Pressable>

                  {isParent && isExpanded && children.length > 0 && (
                    <View className="ml-4 gap-0.5 border-l-2 border-indigo-400/30 pl-2">
                      {children.map((child: any) => {
                        const childKey = child.routeSlug;
                        const childIndex = state.routeNames.indexOf(childKey);
                        const childFocused = state.index === childIndex;
                        const childIcon = iconMap[child.iconKey] || LayoutDashboard;
                        const childCount = getCount(child.permissionColumn, child.routeSlug);

                        return (
                          <Pressable
                            key={childKey}
                            onPress={() => {
                              if (childCount <= 0) {
                                Alert.alert('No pending entries', `No pending requests for ${child.cardTitle}`);
                                return;
                              }
                              navigation.navigate(childKey as any, {
                                title: child.cardTitle,
                                subtitle: 'Review pending requests',
                                routeSlug: childKey,
                              });
                            }}
                            className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 ${childFocused ? 'bg-white/15' : 'bg-transparent'}`}
                          >
                            <View className="flex-row items-center flex-1">
                              {React.createElement(childIcon, {
                                size: 15,
                                color: childFocused ? '#FFFFFF' : '#A5B4FC',
                                strokeWidth: 2.2,
                              })}
                              <Text
                                className={`ml-2.5 flex-1 text-sm font-bold ${childFocused ? 'text-white' : 'text-indigo-200'}`}
                                numberOfLines={1}
                              >
                                {child.cardTitle}
                              </Text>
                            </View>
                            {childCount > 0 && (
                              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1">
                                <Text className="text-[10px] font-black text-white">{childCount}</Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <View className="h-px bg-white/10 my-4" />

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
  const { counts, cards } = useAppSelector((state) => state.dashboard);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const permanent = width >= 1024;
  const userName = user?.name || 'User';
  const userPermissions = user?.permissions || [];

  const allowedCards = useMemo(
    () => (Array.isArray(cards) ? cards : []).filter((card: any) =>
      user?.role?.toLowerCase() === 'admin' || userPermissions.includes(card.permissionColumn)
    ),
    [user, userPermissions, cards],
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchApprovalCounts());
      dispatch(fetchDashboardCards());
    }, [dispatch]),
  );

  const handleScreenshot = async () => {
    try {
      const uri = await captureScreen({ format: 'jpg', quality: 0.8 });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Screenshot',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      Alert.alert('Capture Failed', 'An error occurred while taking the screenshot.');
    }
  };

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
            onLogout={() => dispatch(logoutUser())}
            allowedCards={allowedCards}
            allCards={cards}
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
                  <Pressable
                    onPress={handleScreenshot}
                    className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 active:bg-slate-100"
                  >
                    <Camera size={18} color="#475569" />
                  </Pressable>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#8E78FF] shadow-sm">
                    <Text className="text-sm font-black text-white">{(userName.charAt(0) || 'U').toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              {route.name !== 'Dashboard' && (
                <View className="border-t border-slate-100">
                  <Breadcrumbs />
                </View>
              )}
            </View>
          );
        },
        drawerType: permanent ? 'permanent' : 'front',
        drawerStyle: { width: 320, backgroundColor: 'transparent' },
        overlayColor: 'rgba(15,23,42,0.45)',
        sceneStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen
        name="SubModule"
        component={SubModuleScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      {allowedCards.map((card: any) => (
        <Drawer.Screen
          key={card.routeSlug}
          name={card.routeSlug}
          options={{ title: card.cardTitle }}
          component={ApprovalScreen}
          initialParams={{
            title: card.cardTitle,
            subtitle: 'Review pending requests',
            routeSlug: card.routeSlug,
          }}
        />
      ))}
      <Drawer.Screen
        name="ViewDetail"
        component={ViewDetailScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: 'Messages' }}
      />
      <Drawer.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }}
      />
    </Drawer.Navigator>
  );
}
