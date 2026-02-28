import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Modal, TouchableOpacity } from "react-native";
import {
    Search,
    Filter,
    ChevronDown,
    RotateCcw,
    Loader2,
    Calendar,
    X,
} from "lucide-react-native";

interface FilterFormProps {
    filters?: Record<string, any>;
    filterOptions?: {
        companies?: string[];
        purchaseTypes?: string[];
        suppliers?: any[];
        departments?: any[];
    };
    onFilterChange?: (filters: Record<string, any>) => void;
    onReset?: () => void;
    onApplyFilters?: (filters: Record<string, any>) => void;
    isLoading?: boolean;
    title?: string;
}

const DEFAULT_FILTERS = {};
const DEFAULT_FILTER_OPTIONS = {
    companies: [],
    purchaseTypes: [],
    suppliers: [],
    departments: [],
};

const FilterForm: React.FC<FilterFormProps> = ({
    filters = DEFAULT_FILTERS,
    filterOptions = DEFAULT_FILTER_OPTIONS,
    onFilterChange,
    onReset,
    onApplyFilters,
    isLoading = false,
    title = "Filter Approval Requests",
}) => {
    const [localFilters, setLocalFilters] = useState<Record<string, any>>({ ...filters });
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [activePicker, setActivePicker] = useState<string | null>(null);
    const [datePickerState, setDatePickerState] = useState<{ visible: boolean; field: string; date: Date }>({
        visible: false,
        field: "",
        date: new Date(),
    });

    const {
        companies = [],
        purchaseTypes = [],
        suppliers = [],
        departments = [],
    } = filterOptions;

    const filtersKey = JSON.stringify(filters);
    useEffect(() => {
        setLocalFilters({ ...filters });
    }, [filtersKey]);

    const handleChange = (field: string, value: any, autoApply = true) => {
        const updated = { ...localFilters, [field]: value };
        setLocalFilters(updated);
        if (autoApply) {
            onApplyFilters?.(updated);
            onFilterChange?.(updated);
        }
    };

    const handleReset = () => {
        const cleared = Object.keys(localFilters).reduce((acc, key) => ({ ...acc, [key]: "" }), {});
        setLocalFilters(cleared);
        onApplyFilters?.(cleared);
        onReset?.();
    };

    // Date Picker Helpers
    const formatDate = (date: Date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
    };

    const renderCalendar = () => {
        const { date, field } = datePickerState;
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        const changeMonth = (offset: number) => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() + offset);
            setDatePickerState({ ...datePickerState, date: newDate });
        };

        return (
            <Modal
                visible={datePickerState.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDatePickerState({ ...datePickerState, visible: false })}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-center items-center p-6"
                    activeOpacity={1}
                    onPress={() => setDatePickerState({ ...datePickerState, visible: false })}
                >
                    <View className="bg-white rounded-3xl overflow-hidden w-full max-w-[340px] shadow-2xl border border-slate-100">
                        <View className="bg-indigo-600 p-6 flex-row items-center justify-between">
                            <TouchableOpacity onPress={() => changeMonth(-1)}>
                                <ChevronDown size={24} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
                            </TouchableOpacity>
                            <View className="items-center">
                                <Text className="text-white text-[16px] font-black tracking-tight">{monthNames[month]}</Text>
                                <Text className="text-white/60 text-[12px] font-bold">{year}</Text>
                            </View>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <ChevronDown size={24} color="white" style={{ transform: [{ rotate: '270deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            <View className="flex-row mb-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <View key={i} className="flex-1 items-center">
                                        <Text className="text-[10px] font-black text-slate-300 uppercase">{d}</Text>
                                    </View>
                                ))}
                            </View>

                            <View className="flex-row flex-wrap">
                                {days.map((day, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        className="h-10 w-[14.28%] items-center justify-center rounded-xl"
                                        disabled={!day}
                                        onPress={() => {
                                            const selectedDate = new Date(year, month, day!);
                                            handleChange(field, formatDate(selectedDate));
                                            setDatePickerState({ ...datePickerState, visible: false });
                                        }}
                                    >
                                        {day && (
                                            <Text className={`text-[14px] font-black ${formatDate(new Date(year, month, day)) === localFilters[field] ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {day}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    const renderPicker = (label: string, field: string, options: string[], placeholder: string) => {
        const selectedValue = localFilters[field] || "";
        const displayValue = selectedValue || placeholder;

        return (
            <View className="mb-4 flex-1">
                <Text className="text-[13px] font-bold text-slate-500 mb-1.5 ml-1">{label}</Text>
                <Pressable
                    onPress={() => setActivePicker(field)}
                    className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5"
                >
                    <Text className={`text-[14px] font-semibold ${selectedValue ? 'text-slate-800' : 'text-slate-400'}`}>
                        {displayValue}
                    </Text>
                    <ChevronDown size={14} color="#94A3B8" />
                </Pressable>

                <Modal
                    visible={activePicker === field}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setActivePicker(null)}
                >
                    <TouchableOpacity
                        className="flex-1 bg-black/40 justify-center p-6"
                        activeOpacity={1}
                        onPress={() => setActivePicker(null)}
                    >
                        <View className="bg-white rounded-2xl overflow-hidden max-h-[70%] shadow-2xl border border-slate-100">
                            <View className="p-4 border-b border-slate-100 flex-row items-center justify-between">
                                <Text className="text-lg font-bold text-slate-800">{label}</Text>
                                <Pressable onPress={() => setActivePicker(null)}>
                                    <X size={20} color="#64748B" />
                                </Pressable>
                            </View>
                            <ScrollView>
                                <Pressable
                                    onPress={() => { handleChange(field, ""); setActivePicker(null); }}
                                    className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                                >
                                    <Text className={`text-base font-bold ${!selectedValue ? 'text-indigo-600' : 'text-slate-500'}`}>{placeholder}</Text>
                                    {!selectedValue && <View className="h-2 w-2 rounded-full bg-indigo-600" />}
                                </Pressable>
                                {options.map((opt) => (
                                    <Pressable
                                        key={opt}
                                        onPress={() => { handleChange(field, opt); setActivePicker(null); }}
                                        className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                                    >
                                        <Text className={`text-base font-bold ${selectedValue === opt ? 'text-indigo-600' : 'text-slate-700'}`}>{opt}</Text>
                                        {selectedValue === opt && <View className="h-2 w-2 rounded-full bg-indigo-600" />}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    };

    return (
        <View className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            {/* Design matching Next.js FilterForm Header */}
            <View className="bg-white px-6 py-5 border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-4">
                    <Filter size={20} color="#4F46E5" strokeWidth={2.5} />
                    <Text className="ml-3 text-[18px] font-black text-slate-800 tracking-tight leading-6">
                        {title}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={handleReset}
                    className="items-center justify-center pl-4 border-l border-slate-100"
                >
                    <RotateCcw size={18} color="#94A3B8" />
                    <Text className="mt-1 text-[11px] font-black text-slate-400 text-center">Reset{"\n"}All</Text>
                </TouchableOpacity>
            </View>

            <View className="p-6">
                <View>
                    {renderPicker("Company", "company", companies, "All Companies")}
                    {renderPicker("Purchase Type", "purchaseType", purchaseTypes, "All Types")}
                    {renderPicker("Supplier", "supplier", suppliers, "All Suppliers")}
                    {renderPicker("Department", "department", departments, "All Departments")}

                    <View className="mb-4">
                        <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">Search From Date</Text>
                        <Pressable
                            onPress={() => setDatePickerState({ visible: true, field: "searchFrom", date: localFilters.searchFrom ? new Date(localFilters.searchFrom) : new Date() })}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                        >
                            <Text className={`text-[15px] font-black ${localFilters.searchFrom ? 'text-slate-800' : 'text-slate-300'}`}>
                                {localFilters.searchFrom || "YYYY-MM-DD"}
                            </Text>
                            <Calendar size={18} color="#94A3B8" />
                        </Pressable>
                    </View>

                    <View className="mb-4">
                        <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">Search To Date</Text>
                        <Pressable
                            onPress={() => setDatePickerState({ visible: true, field: "searchTo", date: localFilters.searchTo ? new Date(localFilters.searchTo) : new Date() })}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                        >
                            <Text className={`text-[15px] font-black ${localFilters.searchTo ? 'text-slate-800' : 'text-slate-300'}`}>
                                {localFilters.searchTo || "YYYY-MM-DD"}
                            </Text>
                            <Calendar size={18} color="#94A3B8" />
                        </Pressable>
                    </View>

                    <View className="mt-2">
                        <Text className="text-[13px] font-bold text-slate-500 mb-2 ml-1">PO Roll No</Text>
                        <View className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center">
                            <TextInput
                                placeholder="Enter PO Roll No"
                                placeholderTextColor="#CBD5E1"
                                value={localFilters.poRollNo || ""}
                                onChangeText={(val) => handleChange("poRollNo", val, false)}
                                className="flex-1 text-[15px] font-extrabold text-slate-700 p-0"
                            />
                        </View>
                    </View>
                </View>

                {/* Advanced Toggle Matching Next.js Design */}
                <View className="mt-6 pt-2 border-t border-slate-100">
                    <Pressable
                        onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="flex-row items-center py-2"
                    >
                        <Text className="text-[14px] font-bold text-slate-700 mr-2">Advanced Filters</Text>
                        <ChevronDown size={14} color="#64748B" style={isAdvancedOpen ? { transform: [{ rotate: '180deg' }] } : {}} />
                    </Pressable>

                    {isAdvancedOpen && (
                        <View className="mt-4">
                            {renderPicker("Currency", "currency", ["TSH", "USD"], "All Currencies")}
                            <View className="flex-row gap-4 mb-4">
                                <View className="flex-1">
                                    <Text className="text-[13px] font-bold text-slate-500 mb-1.5 ml-1">Min Amount</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#CBD5E1"
                                        value={String(localFilters.minAmount || "")}
                                        onChangeText={(val) => handleChange("minAmount", val)}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[14px] font-semibold text-slate-700"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[13px] font-bold text-slate-500 mb-1.5 ml-1">Max Amount</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#CBD5E1"
                                        value={String(localFilters.maxAmount || "")}
                                        onChangeText={(val) => handleChange("maxAmount", val)}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[14px] font-semibold text-slate-700"
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
            {renderCalendar()}
        </View>
    );
};

export default FilterForm;
