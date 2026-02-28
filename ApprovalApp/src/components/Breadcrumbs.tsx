import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { ChevronRight, Home } from 'lucide-react-native';

interface BreadcrumbItem {
    name: string;
    label: string;
    isLast: boolean;
    isDashboard: boolean;
}

const SLUG_TITLE_MAP: Record<string, string> = {
    'purchase-order': 'Purchase Order',
    'work-order': 'Work Order',
    'price-approval': 'Price Approval',
    'sales-return-approval': 'Sales Return',
};

const ROUTE_NAME_MAP: Record<string, string> = {
    'purchase-order': 'PurchaseOrder',
    'work-order': 'WorkOrder',
    'price-approval': 'PriceApproval',
    'sales-return-approval': 'SalesReturn',
};

const Breadcrumbs = () => {
    const navigation = useNavigation();

    // Get the current navigation state
    const state = useNavigationState(s => s);

    const breadcrumbs = useMemo(() => {
        if (!state) return [];

        const items: BreadcrumbItem[] = [];

        // Root Dashboard
        items.push({
            name: 'Dashboard',
            label: 'Dashboard',
            isDashboard: true,
            isLast: false
        });

        const currentRoute = state.routes[state.index];
        const routeName = currentRoute.name;

        if (routeName === 'ViewDetail') {
            const params = currentRoute.params as any;
            const parentSlug = params?.approvalType;

            // Add Parent Module
            if (parentSlug) {
                items.push({
                    name: ROUTE_NAME_MAP[parentSlug] || 'Dashboard',
                    label: SLUG_TITLE_MAP[parentSlug] || 'Module',
                    isDashboard: false,
                    isLast: false
                });
            }

            // Add Details
            items.push({
                name: 'ViewDetail',
                label: 'Details',
                isDashboard: false,
                isLast: true
            });
        } else if (routeName !== 'Dashboard') {
            items.push({
                name: routeName,
                label: (currentRoute.params as any)?.title || routeName,
                isDashboard: false,
                isLast: true
            });
        } else {
            items[0].isLast = true;
        }

        return items;
    }, [state]);

    if (breadcrumbs.length === 0 || (breadcrumbs.length === 1 && breadcrumbs[0].isDashboard)) {
        return null;
    }

    return (
        <View className="flex-row items-center px-4 py-2 bg-slate-50/50">
            {breadcrumbs.map((item, index) => (
                <View key={item.name} className="flex-row items-center">
                    {index > 0 && (
                        <View className="mx-1">
                            <ChevronRight size={14} color="#94A3B8" />
                        </View>
                    )}

                    <TouchableOpacity
                        disabled={item.isLast}
                        onPress={() => (navigation as any).navigate(item.name as any)}
                        className={`flex-row items-center px-2 py-1 rounded-lg ${item.isLast ? 'bg-indigo-50/50' : ''}`}
                    >
                        {item.isDashboard && (
                            <View className="mr-1.5">
                                <Home size={14} color={item.isLast ? '#4F46E5' : '#64748B'} />
                            </View>
                        )}
                        <Text
                            className={`text-xs font-bold truncate max-w-[150px] ${item.isLast ? 'text-indigo-900' : 'text-slate-500'
                                }`}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

export default Breadcrumbs;
