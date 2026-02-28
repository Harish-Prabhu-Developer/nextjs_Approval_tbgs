import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    ArrowLeft,
    Calendar,
    FileText,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Tag,
    Building2,
    Briefcase,
    Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { COMPANY_MASTER, STORE_MASTER, SUPPLIER_MASTER, MOCK_APPROVAL_DATA } from '../data/mockData';

type ViewDetailNavProp = DrawerNavigationProp<RootStackParamList, 'ViewDetail'>;

export default function ViewDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation<ViewDetailNavProp>();
    const insets = useSafeAreaInsets();

    // Safety check for parameters
    const params = (route.params as any) || {};
    const { id, approvalType, item: propItem } = params;

    const [isLoading, setIsLoading] = useState(!propItem);
    const [item, setItem] = useState<any>(propItem);

    useEffect(() => {
        // If we don't have the full item data but have an ID and Type, "fetch" it
        if (!propItem && id && approvalType) {
            setIsLoading(true);
            setTimeout(() => {
                const dataPool = MOCK_APPROVAL_DATA[approvalType] || [];
                // Find by sno or id
                const foundItem = dataPool.find(i => String(i.id || i.sno) === String(id));

                if (foundItem) {
                    setItem(foundItem);
                }
                setIsLoading(false);
            }, 800);
        } else if (propItem) {
            setItem(propItem);
            setIsLoading(false);
        }
    }, [id, approvalType, propItem]);

    const statusInfo = useMemo(() => {
        const s = (item?.finalResponseStatus || item?.status || 'PENDING').toUpperCase();
        switch (s) {
            case 'APPROVED': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved', icon: CheckCircle2, color: '#059669' };
            case 'REJECTED': return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected', icon: AlertCircle, color: '#E11D48' };
            case 'HOLD': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'On Hold', icon: Clock, color: '#D97706' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending', icon: Clock, color: '#475569' };
        }
    }, [item]);

    const DetailCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <View className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <View className="bg-slate-50/50 px-6 py-4 border-b border-slate-50 flex-row items-center">
                <Icon size={18} color="#4F46E5" strokeWidth={2.5} />
                <Text className="ml-3 text-[15px] font-black text-slate-800 tracking-tight">{title}</Text>
            </View>
            <View className="p-6">
                {children}
            </View>
        </View>
    );

    const InfoRow = ({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) => (
        <View className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b border-slate-50' : ''}`}>
            <Text className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{label}</Text>
            <Text className="text-[14px] font-black text-slate-700 flex-1 text-right ml-4" numberOfLines={1}>{value}</Text>
        </View>
    );

    const ApprovalStep = ({ title, person, status, remarks, isFirst = false }: { title: string, person: string, status: string, remarks: string, isFirst?: boolean }) => {
        const stepStatus = status.toUpperCase();
        const color = stepStatus === 'APPROVED' ? '#059669' : stepStatus === 'PENDING' ? '#475569' : '#D97706';

        return (
            <View className={`mb-6 ${!isFirst ? 'pt-6 border-t border-slate-50' : ''}`}>
                <Text className="text-[11px] font-black text-indigo-400 uppercase tracking-[2px] mb-4">{title}</Text>

                <View className="flex-row items-center mb-4">
                    <View className="h-10 w-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
                        <User size={20} color="#64748B" />
                    </View>
                    <View>
                        <Text className="text-[14px] font-black text-slate-800">{person || 'Not Assigned'}</Text>
                        <Text className="text-[12px] font-bold text-slate-400">{stepStatus}</Text>
                    </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remarks</Text>
                    <Text className="text-[13px] font-semibold text-slate-600 italic">
                        "{remarks || 'No remarks provided yet'}"
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-slate-50 items-center justify-center">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-4 font-bold text-slate-400 tracking-widest uppercase">Fetching Details...</Text>
            </View>
        );
    }

    const companyName = COMPANY_MASTER.find(c => c.companyId === item?.companyId)?.companyName || item?.companyId || 'N/A';
    const deptName = STORE_MASTER.find(s => s.storeId === item?.poStoreId)?.storeName || item?.poStoreId || 'N/A';
    const supplierName = SUPPLIER_MASTER.find(s => s.supplierId === item?.supplierId)?.supplierName || 'N/A';

    const renderStatusBadge = (status: string) => {
        const s = (status || 'PENDING').toUpperCase();
        let bg = 'bg-slate-100';
        let text = 'text-slate-600';

        if (s === 'APPROVED') { bg = 'bg-emerald-100'; text = 'text-emerald-700'; }
        else if (s === 'REJECTED') { bg = 'bg-rose-100'; text = 'text-rose-700'; }
        else if (s === 'HOLD') { bg = 'bg-amber-100'; text = 'text-amber-700'; }

        return (
            <View className={`${bg} px-3 py-1 rounded-full border border-white/20 self-start`}>
                <Text className={`${text} text-[10px] font-black tracking-widest uppercase`}>{s}</Text>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Top Navigation Row */}
            <View className="bg-white border-b border-slate-100 pt-1">

                <View className="px-6 py-5 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="text-[28px] font-black text-slate-900 tracking-tight mb-1">
                            {item?.poRefNo || `PO-${id}`}
                        </Text>
                        <View className="flex-row items-center flex-wrap">
                            <Text className="text-[13px] font-bold text-slate-500 mr-2">
                                {approvalType?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Approvals
                            </Text>
                            <Text className="text-[13px] font-bold text-slate-300 mr-2">•</Text>
                            <Text className="text-[13px] font-bold text-slate-500 mr-2">ID: {id}</Text>
                            <Text className="text-[13px] font-bold text-slate-300 mr-2">•</Text>
                            {renderStatusBadge(item?.status || item?.finalResponseStatus)}
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex-row items-center bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm active:bg-slate-50"
                    >
                        <ArrowLeft size={16} color="#475569" strokeWidth={2.5} />
                        <Text className="ml-2 text-[14px] font-black text-slate-700">Back</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Purchase Order Details Card */}
                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                    <View className="px-6 py-4 border-b border-slate-50">
                        <Text className="text-[16px] font-black text-slate-800 tracking-tight">Purchase Order Details</Text>
                    </View>
                    <View className="p-6">
                        <InfoRow label="PO Number" value={item?.poRefNo || 'N/A'} />
                        <InfoRow label="PO Type" value={item?.purchaseType || 'DOMESTIC'} />
                        <InfoRow label="Cell" value={item?.cell || 'A1'} />
                        <InfoRow label="Company" value={companyName} />
                        <InfoRow label="Department" value={deptName} />
                        <InfoRow label="Currency" value={item?.currencyType || 'N/A'} />
                        <InfoRow label="PO Amount" value={`${Number(item?.totalFinalProductionHdrAmount || 0).toLocaleString()} ${item?.currencyType || ''}`} />
                        <InfoRow label="Pending Days" value="0 days" isLast />
                    </View>
                </View>

                {/* Supplier & Product Card */}
                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                    <View className="px-6 py-4 border-b border-slate-50">
                        <Text className="text-[16px] font-black text-slate-800 tracking-tight">Supplier & Product</Text>
                    </View>
                    <View className="p-6">
                        <InfoRow label="Supplier" value={String(supplierName).toUpperCase()} />
                        <InfoRow label="Top Product" value={String(item?.topProduct || 'RED SILICON B50/PC').toUpperCase()} />
                        <InfoRow label="Requested By" value={item?.requestedBy || 'raw / 07-Jan-2026'} />
                        <InfoRow label="Request Date" value={item?.requestedDate || (item?.requestedBy?.split('/')?.[1]?.trim()) || '07-Jan-2026'} isLast />
                    </View>
                </View>

                {/* Approval Steps Cards */}
                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                    <View className="px-6 py-4 border-b border-slate-50">
                        <Text className="text-[16px] font-black text-slate-800 tracking-tight">First Approval</Text>
                    </View>
                    <View className="p-6">
                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approver</Text>
                        <Text className="text-[15px] font-black text-slate-800 mb-4">{item?.response1Person || 'Mr. Kalpesh'}</Text>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</Text>
                        <View className="mb-4">{renderStatusBadge(item?.response1Status || 'APPROVED')}</View>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</Text>
                        <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <Text className="text-[14px] font-semibold text-slate-600 italic">
                                {item?.response1Remarks || 'Quality checked'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                    <View className="px-6 py-4 border-b border-slate-50">
                        <Text className="text-[16px] font-black text-slate-800 tracking-tight">Second Approval</Text>
                    </View>
                    <View className="p-6">
                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approver</Text>
                        <Text className="text-[15px] font-black text-slate-800 mb-4">{item?.response2Person || 'Shaaf'}</Text>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</Text>
                        <View className="mb-4">{renderStatusBadge(item?.response2Status || 'PENDING')}</View>

                        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</Text>
                        <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <Text className="text-[14px] font-semibold text-slate-600 italic">
                                {item?.response2Remarks || 'No remarks provided'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View className="items-center py-6">
                    <Text className="text-[12px] font-bold text-slate-400 text-center leading-relaxed">
                        © 2026 Vision Infotech Ltd. All rights reserved.{"\n"}
                        Approval System v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
