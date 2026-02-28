import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    Pressable,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableOpacity,
    Platform,
} from "react-native";
import {
    ChevronUp,
    ChevronDown,
    Search,
    Loader2,
    AlertCircle,
    RefreshCw,
    X,
    Check,
    Download,
    Settings,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import Pagination from "./Pagination";

export interface Column {
    key: string;
    label: string;
    responsiveClass?: string;
    headerAlign?: 'left' | 'center' | 'right';
    render?: (value: any, row?: any, options?: any) => React.ReactNode;
}

interface PaginationProps {
    enabled: boolean;
    currentPage: number;
    itemsPerPage: number | string;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (value: number | string) => void;
}

interface SelectionProps {
    enabled: boolean;
    selectedRows: any[];
    onSelectedRowsChange?: (rows: any[]) => void;
}

interface ExpansionProps {
    enabled: boolean;
    expandedRows: any[];
    expandedColumns?: Column[];
    hideExpansionColumn?: boolean;
    onExpandedRowsChange?: (rows: any[]) => void;
    renderExpansion?: (row: any, columns?: Column[]) => React.ReactNode;
}

interface ExportOptions {
    enabled: boolean;
    onExport?: (format: string) => void | Promise<void>;
    formats: string[];
}

interface DataTableProps {
    data?: any[];
    columns: Column[];
    rowKey?: string;
    title?: string;
    subTitle?: string;
    isLoading?: boolean;
    selection?: SelectionProps;
    expansion?: ExpansionProps;
    totalRows?: number;
    pagination?: PaginationProps;
    exportOptions?: ExportOptions;
    bulkActions?: (ids: any[]) => React.ReactNode;
    toolbarActions?: React.ReactNode;
    emptyMessage?: string;
    showSearch?: boolean;
    onSearch?: (term: string) => void;
    useInternalState?: {
        selection?: boolean;
        expansion?: boolean;
        pagination?: boolean;
        sorting?: boolean;
    };
    apiEndpoint?: string;
    approvalCode?: string;
    autoFetch?: boolean;
    onDataFetched?: (data: any[]) => void;
}

const DEFAULT_SELECTION: SelectionProps = { enabled: false, selectedRows: [], onSelectedRowsChange: () => { } };
const DEFAULT_EXPANSION: ExpansionProps = { enabled: false, expandedRows: [], expandedColumns: [], onExpandedRowsChange: () => { }, renderExpansion: undefined, hideExpansionColumn: false };
const DEFAULT_PAGINATION: PaginationProps = { enabled: true, currentPage: 1, itemsPerPage: 10, onPageChange: () => { }, onItemsPerPageChange: () => { } };
const DEFAULT_EXPORT_OPTIONS: ExportOptions = { enabled: true, formats: ['csv', 'excel', 'pdf'] };
const DEFAULT_INTERNAL_STATE = { selection: true, expansion: true, pagination: true, sorting: true };
const DOWNLOAD_URI_STORAGE_KEY = "approvalapp_download_directory_uri";

const DataTable: React.FC<DataTableProps> = ({
    data: propData = [],
    columns = [],
    rowKey = "id",
    title,
    subTitle,
    isLoading: propIsLoading = false,
    selection = DEFAULT_SELECTION,
    expansion = DEFAULT_EXPANSION,
    totalRows: propTotalRows = null,
    pagination = DEFAULT_PAGINATION,
    exportOptions = DEFAULT_EXPORT_OPTIONS,
    bulkActions = null,
    toolbarActions = null,
    emptyMessage = "No records found",
    showSearch = false,
    onSearch = () => { },
    useInternalState = DEFAULT_INTERNAL_STATE,
    apiEndpoint,
    approvalCode,
    autoFetch = true,
    onDataFetched,
}) => {
    const [apiData, setApiData] = useState<any[]>([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiTotalRows, setApiTotalRows] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    const [internalSelectedRows, setInternalSelectedRows] = useState<any[]>([]);
    const [internalExpandedRows, setInternalExpandedRows] = useState<any[]>([]);
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalItemsPerPage, setInternalItemsPerPage] = useState<number | string>(pagination.itemsPerPage || 10);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDropdown, setActiveDropdown] = useState<'show' | 'export' | 'status' | null>(null);
    const [filterStatus, setFilterStatus] = useState("PENDING");
    const [downloadDirectoryUri, setDownloadDirectoryUri] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const loadSavedDownloadUri = async () => {
            try {
                const savedUri = await AsyncStorage.getItem(DOWNLOAD_URI_STORAGE_KEY);
                if (mounted && savedUri) setDownloadDirectoryUri(savedUri);
            } catch {
                // ignore cache read errors
            }
        };
        loadSavedDownloadUri();
        return () => {
            mounted = false;
        };
    }, []);

    const filteredLocalData = useMemo(() => {
        if (apiEndpoint) return [];

        let result = [...propData];

        // 1. Filter by Status
        if (filterStatus !== 'ALL') {
            result = result.filter(item => {
                const itemStatus = item.status || item.statusEntry || 'PENDING';
                return String(itemStatus).toUpperCase() === filterStatus.toUpperCase();
            });
        }

        // 2. Filter by Search Term
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item => {
                return Object.values(item).some(val =>
                    val !== null && val !== undefined && String(val).toLowerCase().includes(lowerTerm)
                );
            });
        }

        return result;
    }, [propData, filterStatus, searchTerm, apiEndpoint]);

    const effectiveData = apiEndpoint ? apiData : filteredLocalData;
    const effectiveIsLoading = apiEndpoint ? apiLoading : propIsLoading;
    const effectiveTotalItems = apiEndpoint ? apiTotalRows : effectiveData.length;

    const paginationPage = useInternalState.pagination ? internalCurrentPage : pagination.currentPage;
    const paginationLimit = useInternalState.pagination ? internalItemsPerPage : pagination.itemsPerPage;

    const displayData = useMemo(() => {
        if (apiEndpoint) return effectiveData;
        if (paginationLimit === 'all') return effectiveData;

        const start = (paginationPage - 1) * Number(paginationLimit);
        const end = start + Number(paginationLimit);
        return effectiveData.slice(start, end);
    }, [apiEndpoint, effectiveData, paginationPage, paginationLimit]);

    useEffect(() => {
        if (!autoFetch || !apiEndpoint) return;
        let isMounted = true;
        const fetchData = async () => {
            try {
                if (isMounted) { setApiLoading(true); setApiError(null); }
                const token = await AsyncStorage.getItem("tbgs_access_token");
                if (!token) throw new Error("No authentication token found");
                const finalApprovalCode = approvalCode || 'PO_APPROVAL';
                const params: any = {
                    page: paginationPage,
                    limit: paginationLimit !== 'all' ? Number(paginationLimit) : 100,
                    approvalCode: finalApprovalCode,
                    status: filterStatus !== 'ALL' ? filterStatus : undefined,
                    search: searchTerm
                };
                const queryStr = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
                const url = `${apiEndpoint}?${queryStr}`;
                const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error("Failed to load data");
                const result = await response.json();
                if (isMounted) {
                    setApiData(result.data || []);
                    setApiTotalRows(result.pagination?.total || 0);
                    onDataFetched?.(result.data || []);
                }
            } catch (error: any) {
                if (isMounted) { setApiError(error.message || 'Failed to load data'); }
            } finally {
                if (isMounted) setApiLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [apiEndpoint, approvalCode, autoFetch, paginationPage, paginationLimit, searchTerm, filterStatus]);

    const effectiveSelectedRows = useInternalState.selection ? internalSelectedRows : (selection.selectedRows || []);
    const effectiveExpandedRows = useInternalState.expansion ? internalExpandedRows : (expansion.expandedRows || []);
    const effectiveCurrentPage = useInternalState.pagination ? internalCurrentPage : pagination.currentPage;
    const effectiveItemsPerPage = useInternalState.pagination ? internalItemsPerPage : pagination.itemsPerPage;

    const handleRowSelect = (id: any) => {
        const isSelected = effectiveSelectedRows.includes(id);
        let newSelected = isSelected
            ? effectiveSelectedRows.filter(rowId => rowId !== id)
            : [...effectiveSelectedRows, id];
        if (useInternalState.selection) setInternalSelectedRows(newSelected);
        selection.onSelectedRowsChange?.(newSelected);
    };

    const handleSelectAll = (isAll: boolean) => {
        const newSelected = isAll ? effectiveData.map(row => row[rowKey]) : [];
        if (useInternalState.selection) setInternalSelectedRows(newSelected);
        selection.onSelectedRowsChange?.(newSelected);
    };

    const toggleRowExpansion = (id: any) => {
        const newExpanded = effectiveExpandedRows.includes(id)
            ? effectiveExpandedRows.filter(rowId => rowId !== id)
            : [...effectiveExpandedRows, id];
        if (useInternalState.expansion) setInternalExpandedRows(newExpanded);
        expansion.onExpandedRowsChange?.(newExpanded);
    };

    const isPaginationAll = effectiveItemsPerPage === 'all';
    const totalPages = isPaginationAll ? 1 : Math.ceil(effectiveTotalItems / Number(effectiveItemsPerPage));

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        if (useInternalState.pagination) setInternalCurrentPage(page);
        pagination.onPageChange?.(page);
    };

    const exportableColumns = useMemo(
        () => columns.filter((col) => col.key && col.key !== "action"),
        [columns]
    );

    const exportRows = useMemo(() => {
        if (effectiveSelectedRows.length > 0) {
            const selectedSet = new Set(effectiveSelectedRows);
            return effectiveData.filter((row) => selectedSet.has(row[rowKey]));
        }
        return effectiveData;
    }, [effectiveData, effectiveSelectedRows, rowKey]);

    const formatCellValue = (value: any) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const toCsvContent = (rows: any[]) => {
        const escapeCsv = (input: string) => `"${input.replace(/"/g, '""')}"`;
        const header = exportableColumns.map((c) => escapeCsv(c.label)).join(",");
        const body = rows
            .map((row) =>
                exportableColumns
                    .map((c) => escapeCsv(formatCellValue(row[c.key])))
                    .join(",")
            )
            .join("\n");
        return `${header}\n${body}`;
    };

    const toSimplePdfBytes = (rows: any[]) => {
        const textLines: string[] = [
            "Approval Requests Report",
            `Generated: ${new Date().toLocaleString()}`,
            `Records: ${rows.length}`,
            "",
            exportableColumns.map((c) => c.label).join(" | "),
            ...rows.map((row) =>
                exportableColumns.map((c) => formatCellValue(row[c.key])).join(" | ")
            ),
        ];

        const sanitizePdfText = (line: string) =>
            line
                .replace(/\\/g, "\\\\")
                .replace(/\(/g, "\\(")
                .replace(/\)/g, "\\)")
                .replace(/[^\x20-\x7E]/g, " ");

        const maxLines = 44;
        const lines = textLines.slice(0, maxLines);
        const contentStream =
            "BT\n/F1 10 Tf\n50 790 Td\n14 TL\n" +
            lines
                .map((line, idx) =>
                    idx === 0
                        ? `(${sanitizePdfText(line)}) Tj`
                        : `T* (${sanitizePdfText(line)}) Tj`
                )
                .join("\n") +
            "\nET";

        const objects: string[] = [];
        objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
        objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
        objects[3] =
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
        objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
        objects[5] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;

        let pdf = "%PDF-1.4\n";
        const xref: number[] = [0];
        for (let i = 1; i <= 5; i++) {
            xref[i] = pdf.length;
            pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
        }
        const xrefStart = pdf.length;
        pdf += `xref\n0 6\n0000000000 65535 f \n`;
        for (let i = 1; i <= 5; i++) {
            pdf += `${String(xref[i]).padStart(10, "0")} 00000 n \n`;
        }
        pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        return pdf;
    };

    const blobToBase64 = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result !== "string") {
                    reject(new Error("Failed to convert file to base64"));
                    return;
                }
                const base64 = result.split(",")[1];
                resolve(base64 || "");
            };
            reader.onerror = () => reject(new Error("Failed to read blob"));
            reader.readAsDataURL(blob);
        });

    const notifyDownloadComplete = async (fileName: string) => {
        if (Platform.OS !== "android") return;
        if (Constants.appOwnership === "expo") return; // Expo Go: notifications unsupported on Android SDK 53+

        let Notifications: any = null;
        try {
            Notifications = require("expo-notifications");
        } catch {
            return;
        }

        try {
            if (Notifications.setNotificationChannelAsync) {
                await Notifications.setNotificationChannelAsync("downloads", {
                    name: "Downloads",
                    importance: Notifications.AndroidImportance?.HIGH ?? 4,
                    vibrationPattern: [0, 200, 150, 200],
                    lightColor: "#4F46E5",
                });
            }

            const permission = await Notifications.getPermissionsAsync();
            if (!permission.granted) {
                const requested = await Notifications.requestPermissionsAsync();
                if (!requested.granted) return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Download complete",
                    body: `${fileName} saved to Download folder`,
                    sound: "default",
                    priority: Notifications.AndroidNotificationPriority?.HIGH,
                },
                trigger: null,
            });
        } catch {
            // keep export success flow even if notification fails
        }
    };

    const saveToDownloads = async (fileName: string, mimeType: string, content: string) => {
        if (Platform.OS !== "android") {
            Alert.alert("Not supported", "Download to public Downloads is currently enabled for Android.");
            return;
        }

        // Preferred path: native Android file write without folder picker (dev build / standalone).
        if (Constants.appOwnership !== "expo") {
            try {
                const ReactNativeBlobUtil = require("react-native-blob-util").default;
                if (ReactNativeBlobUtil?.fs?.writeFile) {
                    const dirs = ReactNativeBlobUtil.fs.dirs || {};
                    const downloadDir = dirs.LegacyDownloadDir || dirs.DownloadDir;
                    if (downloadDir) {
                        const filePath = `${downloadDir}/${fileName}`;
                        const blob = new Blob([content], { type: mimeType });
                        const base64Data = await blobToBase64(blob);

                        await ReactNativeBlobUtil.fs.writeFile(filePath, base64Data, "base64");
                        try {
                            await ReactNativeBlobUtil.fs.scanFile([{ path: filePath, mime: mimeType }]);
                        } catch {
                            // no-op
                        }
                        try {
                            await ReactNativeBlobUtil.android.addCompleteDownload({
                                title: fileName,
                                description: "Downloaded from ApprovalApp",
                                mime: mimeType,
                                path: filePath,
                                showNotification: true,
                            });
                        } catch {
                            // keep success flow if DownloadManager entry fails on some devices
                        }

                        await notifyDownloadComplete(fileName);
                        Alert.alert("Download complete", `${fileName} saved to Download`);
                        return;
                    }
                }
            } catch {
                // fallback below
            }
        }

        // Fallback path (Expo Go): requires SAF and may open folder picker.
        const downloadsRootUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
        let targetDirectoryUri = downloadDirectoryUri || downloadsRootUri;

        const fileBaseName = fileName.replace(/\.[^/.]+$/, "");
        let fileUri: string;
        try {
            // Try silent create first (works when URI permission is already valid)
            fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                targetDirectoryUri,
                fileBaseName,
                mimeType
            );
        } catch {
            // Ask user only when permission is missing/invalid
            const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsRootUri);
            if (!permission.granted) {
                Alert.alert("Permission needed", "Storage access is required to save files to Download.");
                return;
            }
            targetDirectoryUri = permission.directoryUri;
            setDownloadDirectoryUri(permission.directoryUri);
            await AsyncStorage.setItem(DOWNLOAD_URI_STORAGE_KEY, permission.directoryUri);
            fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                targetDirectoryUri,
                fileBaseName,
                mimeType
            );
        }

        const blob = new Blob([content], { type: mimeType });
        const base64Data = await blobToBase64(blob);
        await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await notifyDownloadComplete(fileName);
        Alert.alert("Download complete", `${fileName} saved to Download`);
    };

    const handleExport = async (format: "CSV" | "Excel" | "PDF") => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const baseName = `${(title || "approval").replace(/\s+/g, "_")}_export_${today}`;

            if (exportRows.length === 0) {
                Alert.alert("No data", "There are no records to export.");
                return;
            }

            if (format === "CSV") {
                await saveToDownloads(`${baseName}.csv`, "text/csv", toCsvContent(exportRows));
            } else if (format === "Excel") {
                await saveToDownloads(
                    `${baseName}.xls`,
                    "application/vnd.ms-excel",
                    toCsvContent(exportRows)
                );
            } else {
                await saveToDownloads(`${baseName}.pdf`, "application/pdf", toSimplePdfBytes(exportRows));
            }
        } catch (error: any) {
            Alert.alert("Export failed", error?.message || "Unable to export file.");
        } finally {
            setActiveDropdown(null);
        }
    };

    const handleExportOption = async (format: string) => {
        try {
            if (exportOptions?.onExport) {
                await Promise.resolve(exportOptions.onExport(format));
                setActiveDropdown(null);
                return;
            }

            const f = format.toLowerCase();
            if (f === "csv") {
                await handleExport("CSV");
            } else if (f === "excel" || f === "xls" || f === "xlsx") {
                await handleExport("Excel");
            } else if (f === "pdf") {
                await handleExport("PDF");
            } else {
                Alert.alert("Unsupported format", `Export format "${format}" is not supported.`);
                setActiveDropdown(null);
            }
        } catch (error: any) {
            Alert.alert("Export failed", error?.message || "Unable to export file.");
            setActiveDropdown(null);
        }
    };

    return (
        <View className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            {/* Toolbar Area matching Next.js Design */}
            <View className="bg-white px-4 py-5 border-b border-gray-100">
                {/* Search and Status Row */}
                <View className="flex-col mb-6">
                    <View className="flex-row items-center bg-gray-50/50 rounded-xl px-4 py-3 border border-gray-200">
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            placeholder="Search by PO number, supplier, product..."
                            placeholderTextColor="#94A3B8"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            className="flex-1 ml-3 text-[14px] font-semibold text-slate-700 h-6 p-0"
                        />
                    </View>

                    <View className="flex-row items-center mt-4 self-center">
                        <Text className="text-slate-500 font-bold mr-2 text-[13px]">Status:</Text>
                        <Pressable
                            onPress={() => setActiveDropdown('status')}
                            className="border border-slate-200 flex-row items-center justify-center gap-2 rounded-lg bg-white px-2 py-1.5 min-w-[80px]"
                        >
                            <Text className="text-[13px] font-bold text-slate-700 capitalize">{filterStatus.toLowerCase()}</Text>
                            <ChevronDown size={14} color="#64748B" className="ml-2" />
                        </Pressable>
                    </View>
                </View>

                <View className="border-t border-slate-50 pt-5">
                    <Text className="text-[18px] font-black text-slate-800 tracking-tight">
                        {title} Approvals Analysis <Text className="opacity-30 font-normal"> • </Text> <Text className="text-slate-500 opacity-60">{effectiveTotalItems}</Text>
                    </Text>
                    <Text className="text-[14px] font-bold text-indigo-400 mt-0.5">
                        records found
                    </Text>
                    <Text className="text-[12px] text-slate-400 font-bold mt-2 opacity-80 uppercase tracking-widest">
                        {effectiveTotalItems} records total • {effectiveSelectedRows.length} selected
                    </Text>
                </View>

                {/* Secondary Toolbar: Show, Export, Sync, Settings */}
                <View className="flex-row items-center justify-between mt-6 px-0.5">
                    <View className="flex-row items-center gap-x-4">
                        <Pressable
                            onPress={() => setActiveDropdown('show')}
                            className="flex-row items-center bg-white border border-slate-200 rounded-xl px-2 py-2 gap-1   shadow-sm shadow-slate-100 h-10"
                        >
                            <Text className="text-[12px] font-bold text-slate-500 mr-2.5">Show:</Text>
                            <Text className="text-[13px] font-black text-slate-800">{effectiveItemsPerPage}</Text>
                            <ChevronDown size={14} color="#94A3B8" className="ml-1.5" />
                        </Pressable>

                        {exportOptions?.enabled && (
                            <Pressable
                                onPress={() => setActiveDropdown('export')}
                                className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 shadow-sm shadow-slate-100 h-10"
                            >
                                <Download size={15} color="#64748B" />
                                <Text className="text-[12px] font-bold text-slate-700">Export</Text>
                                <ChevronDown size={14} color="#94A3B8" />
                            </Pressable>
                        )}
                    </View>

                    <View className="flex-row items-center gap-x-3">
                        <TouchableOpacity className="h-10 w-10 items-center justify-center border border-slate-200 rounded-xl bg-white shadow-sm shadow-slate-100">
                            <RefreshCw size={17} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity className="h-10 w-10 items-center justify-center border border-slate-200 rounded-xl bg-white shadow-sm shadow-slate-100">
                            <Settings size={17} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Bulk Actions matching Next.js Design */}
            {selection.enabled && effectiveSelectedRows.length > 0 && (
                <View className="bg-indigo-600 px-4 py-2.5 flex-row items-center justify-between">
                    <Text className="text-white font-bold text-[13px]">{effectiveSelectedRows.length} items selected</Text>
                    <View className="flex-1 ml-4 mr-2">
                        {bulkActions?.(effectiveSelectedRows)}
                    </View>
                    <Pressable onPress={() => handleSelectAll(false)}>
                        <X size={18} color="#FFFFFF" strokeWidth={3} />
                    </Pressable>
                </View>
            )}

            {/* Main Table ScrollView */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                <View>
                    {/* Table Header row matching bg-[#c7d2fe]/50 */}
                    <View className="flex-row bg-[#c7d2fe]/50 border-b border-gray-200 items-center">
                        {selection.enabled && (
                            <Pressable
                                onPress={() => handleSelectAll(effectiveSelectedRows.length < effectiveData.length)}
                                className="w-12 items-center justify-center py-3.5"
                            >
                                <View className={`h-4 w-4 rounded border-slate-300 border items-center justify-center bg-white`}>
                                    {effectiveSelectedRows.length === effectiveData.length && effectiveData.length > 0 && <View className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />}
                                </View>
                            </Pressable>
                        )}
                        {columns.map((col, idx) => (
                            <View
                                key={col.key || idx}
                                className={`py-3.5 px-4 min-w-[120px] ${col.headerAlign === 'center' ? 'items-center' : col.headerAlign === 'right' ? 'items-end' : 'items-start'}`}
                            >
                                <Text className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{col.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Table Body */}
                    {effectiveIsLoading ? (
                        <View className="py-16 items-center justify-center min-w-[500px]">
                            <ActivityIndicator size="small" color="#4F46E5" />
                            <Text className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Loading records...</Text>
                        </View>
                    ) : effectiveData.length === 0 ? (
                        <View className="py-20 items-center justify-center min-w-[500px]">
                            <AlertCircle size={40} color="#CBD5E1" />
                            <Text className="text-slate-500 font-medium mt-4">{emptyMessage}</Text>
                        </View>
                    ) : (
                        <View className="divide-y divide-slate-100">
                            {displayData.map((row, rowIdx) => (
                                <View key={row[rowKey] || rowIdx}>
                                    <Pressable
                                        onPress={() => selection.enabled ? handleRowSelect(row[rowKey]) : expansion.enabled && toggleRowExpansion(row[rowKey])}
                                        className={`flex-row items-center py-1 ${effectiveSelectedRows.includes(row[rowKey]) ? 'bg-indigo-50/30' : 'active:bg-slate-50/50'}`}
                                    >
                                        {selection.enabled && (
                                            <View className="w-12 items-center justify-center">
                                                <View className={`h-4 w-4 rounded border-slate-300 border items-center justify-center bg-white`}>
                                                    {effectiveSelectedRows.includes(row[rowKey]) && <View className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />}
                                                </View>
                                            </View>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <View key={col.key || colIdx} className="py-3.5 px-4 min-w-[120px]">
                                                {col.render ? (
                                                    col.render(row[col.key], row, {
                                                        isExpanded: effectiveExpandedRows.includes(row[rowKey]),
                                                        toggleExpansion: () => toggleRowExpansion(row[rowKey])
                                                    })
                                                ) : (
                                                    <Text
                                                        numberOfLines={1}
                                                        className={`text-[13px] text-slate-700 ${col.key === 'id' || col.key === 'amount' ? 'font-bold text-slate-800' : 'font-medium'}`}
                                                    >
                                                        {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-'}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </Pressable>

                                    {/* Expansion Card matching Next.js: bg-slate-50/30 border-l-2 border-indigo-400 */}
                                    {expansion.enabled && effectiveExpandedRows.includes(row[rowKey]) && (
                                        <View className="bg-slate-50/30 border-l-2 border-indigo-400 p-5 min-w-[500px]">
                                            {expansion.renderExpansion ? expansion.renderExpansion(row, expansion.expandedColumns) : (
                                                <View className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-row flex-wrap gap-y-6">
                                                    {(expansion.expandedColumns || []).map((eCol, eIdx) => (
                                                        <View key={eCol.key || eIdx} className="w-1/2 pr-4 space-y-1">
                                                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{eCol.label}</Text>
                                                            <Text className="text-[13px] font-bold text-slate-800">
                                                                {eCol.render ? eCol.render(row[eCol.key], row) : (row[eCol.key] !== null && row[eCol.key] !== undefined ? String(row[eCol.key]) : '-')}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Pagination View */}
            {pagination.enabled && (isPaginationAll || (totalPages > 1)) && (
                <View className="p-4 border-t border-gray-100">
                    <Pagination
                        currentPage={effectiveCurrentPage}
                        totalPages={totalPages}
                        totalFilteredCount={effectiveTotalItems}
                        entriesPerPage={effectiveItemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </View>
            )}

            {/* Dropdown Modals (Professional Centered Menu) */}
            <Modal
                visible={!!activeDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveDropdown(null)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/30 justify-center items-center p-6"
                    activeOpacity={1}
                    onPress={() => setActiveDropdown(null)}
                >
                    <View className="bg-white rounded-2xl overflow-hidden w-full max-w-[320px] shadow-2xl border border-slate-100">
                        <View className="p-4 border-b border-slate-100 flex-row items-center justify-between bg-slate-50/50">
                            <Text className="text-[15px] font-black text-slate-800 tracking-tight">
                                {activeDropdown === 'show' ? 'Show Records' : activeDropdown === 'export' ? 'Export Data' : 'Filter by Status'}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                                <X size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-96">
                            {activeDropdown === 'show' && [5, 10, 25, 50, 'all'].map((val) => (
                                <TouchableOpacity
                                    key={val}
                                    onPress={() => {
                                        setInternalItemsPerPage(val);
                                        setInternalCurrentPage(1);
                                        setActiveDropdown(null);
                                    }}
                                    className="p-5 border-b border-slate-50 flex-row items-center justify-between"
                                >
                                    <Text className={`text-base font-bold ${effectiveItemsPerPage === val ? 'text-indigo-600' : 'text-slate-700'}`}>Show {val} records</Text>
                                    {effectiveItemsPerPage === val && <Check size={20} color="#4F46E5" />}
                                </TouchableOpacity>
                            ))}
                            {activeDropdown === 'export' && (exportOptions?.formats || []).map((fmt) => (
                                <TouchableOpacity
                                    key={fmt}
                                    onPress={() => handleExportOption(fmt)}
                                    className="p-5 border-b border-slate-50 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Download size={20} color="#64748B" className="mr-3" />
                                        <Text className="text-base font-bold text-slate-700">Export as {String(fmt).toUpperCase()}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {activeDropdown === 'status' && ['PENDING', 'APPROVED', 'REJECTED', 'HOLD', 'ALL'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => {
                                        setFilterStatus(status);
                                        setActiveDropdown(null);
                                    }}
                                    className="p-5 border-b border-slate-50 flex-row items-center justify-between"
                                >
                                    <Text className={`text-base font-bold ${filterStatus === status ? 'text-indigo-600' : 'text-slate-700'}`}>{status}</Text>
                                    {filterStatus === status && <Check size={20} color="#4F46E5" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default DataTable;
