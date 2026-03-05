import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
    Eye,
    FileText,
    MessageSquareMore,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    X,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Zap,
    FileStack,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerParamList } from '../navigation/types';
import {
    MOCK_APPROVAL_DATA,
    COMPANY_MASTER,
    SUPPLIER_MASTER,
    STORE_MASTER,
} from '../data/mockData';
import DataTable, { Column } from '../components/DataTable';
import FilterForm from '../components/FilterForm';
import PdfViewerModal from '../components/PdfViewerModal';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchApprovalRecords } from '../redux/slices/approvalSlice';
import {
    PURCHASE_ORDER_DTL,
    PURCHASE_ORDER_FILES_UPLOAD,
    PURCHASE_ORDER_ADDITIONAL_COST_DETAILS,
    PRODUCT_MASTER,
} from '../data/mockData';

type ModuleNavProp = DrawerNavigationProp<DrawerParamList>;

type PendingStatusUpdate = {
    ids: any[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HOLD';
};

const sanitizePdfText = (line: string) =>
    String(line)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/[^\x20-\x7E]/g, " ");

const wrapText = (text: string, maxChars = 95) => {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return [""];

    const wrapped: string[] = [];
    let current = "";

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxChars) {
            current = next;
        } else {
            if (current) wrapped.push(current);
            if (word.length > maxChars) {
                for (let i = 0; i < word.length; i += maxChars) {
                    wrapped.push(word.slice(i, i + maxChars));
                }
                current = "";
            } else {
                current = word;
            }
        }
    }
    if (current) wrapped.push(current);
    return wrapped;
};

const toPdfBase64 = (binary: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let output = "";
    let i = 0;

    while (i < binary.length) {
        const c1 = binary.charCodeAt(i++) & 0xff;
        const c2 = i < binary.length ? binary.charCodeAt(i++) & 0xff : NaN;
        const c3 = i < binary.length ? binary.charCodeAt(i++) & 0xff : NaN;

        const e1 = c1 >> 2;
        const e2 = ((c1 & 3) << 4) | ((Number.isNaN(c2) ? 0 : c2) >> 4);
        const e3 = Number.isNaN(c2) ? 64 : (((c2 as number) & 15) << 2) | ((Number.isNaN(c3) ? 0 : c3) >> 6);
        const e4 = Number.isNaN(c3) ? 64 : ((c3 as number) & 63);

        output += chars.charAt(e1);
        output += chars.charAt(e2);
        output += e3 === 64 ? "=" : chars.charAt(e3);
        output += e4 === 64 ? "=" : chars.charAt(e4);
    }

    return output;
};

const formatPdfCell = (value: any, maxChars: number) => {
    const raw = String(value ?? "-").replace(/\s+/g, " ").trim();
    if (!raw) return "-";
    if (raw.length <= maxChars) return raw;
    return `${raw.slice(0, Math.max(0, maxChars - 3))}...`;
};

const measureTextWidth = (text: string, size: number) => text.length * size * 0.5;

const buildPdfFromStreams = (pageStreams: string[]) => {
    const streams = pageStreams.length ? pageStreams : ["BT /F1 10 Tf 40 800 Td (No data) Tj ET"];
    const objects: Record<number, string> = {};
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    const pageObjectNumbers: number[] = [];
    let objectNumber = 5;

    for (const stream of streams) {
        const pageObjectNumber = objectNumber++;
        const contentObjectNumber = objectNumber++;
        pageObjectNumbers.push(pageObjectNumber);

        objects[pageObjectNumber] =
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
            `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
        objects[contentObjectNumber] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }

    objects[2] =
        `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] ` +
        `/Count ${pageObjectNumbers.length} >>`;

    const orderedObjectNumbers = Object.keys(objects)
        .map(Number)
        .sort((a, b) => a - b);

    let pdf = "%PDF-1.4\n";
    const xref: number[] = [0];
    for (const num of orderedObjectNumbers) {
        xref[num] = pdf.length;
        pdf += `${num} 0 obj\n${objects[num]}\nendobj\n`;
    }

    const xrefStart = pdf.length;
    const maxObjectNumber = Math.max(...orderedObjectNumbers);
    pdf += `xref\n0 ${maxObjectNumber + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= maxObjectNumber; i++) {
        const offset = xref[i] || 0;
        const marker = xref[i] ? "n" : "f";
        pdf += `${String(offset).padStart(10, "0")} 00000 ${marker} \n`;
    }

    pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return pdf;
};

const buildInvoicePdfBinary = (params: {
    row: any;
    header: any;
    supplier: any;
    company: any;
    store: any;
    lineItems: any[];
    additionalCosts: any[];
    totals: any;
    qrContent: string;
    qrApiUrl: string;
}) => {
    const {
        row,
        header,
        supplier,
        company,
        store,
        lineItems,
        additionalCosts,
        totals,
        qrContent,
        qrApiUrl,
    } = params;

    const fmt = (value: any) =>
        Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const cmds: string[] = [];
    const left = 24;
    const right = 571;
    const center = (left + right) / 2;
    const pageTop = 812;
    const bottomSafe = 40;
    let y = pageTop;

    const line = (x1: number, y1: number, x2: number, y2: number, width = 0.8) => {
        cmds.push(`${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    };

    const rect = (x: number, yy: number, w: number, h: number, fillGray?: number) => {
        if (typeof fillGray === "number") {
            cmds.push(`q ${fillGray.toFixed(3)} g ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
        }
        cmds.push(`${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    };

    const text = (
        value: string,
        x: number,
        yy: number,
        size = 10,
        isBold = false,
        align: "left" | "center" | "right" = "left",
    ) => {
        const content = sanitizePdfText(value);
        const width = measureTextWidth(content, size);
        let drawX = x;
        if (align === "center") drawX = x - width / 2;
        if (align === "right") drawX = x - width;
        cmds.push(`BT /F${isBold ? "2" : "1"} ${size.toFixed(2)} Tf ${drawX.toFixed(2)} ${yy.toFixed(2)} Td (${content}) Tj ET`);
    };

    // Header block
    text("PURCHASE INVOICE", left, y, 16, true);
    text(`PO Ref: ${header.poRefNo || row.poRefNo || "-"}`, left, y - 16, 9);
    text(`PO Date: ${header.poDate || "-"}`, left, y - 28, 9);
    text(`Generated: ${new Date().toLocaleDateString()}`, left, y - 40, 9);

    const qrBoxX = right - 108;
    const qrBoxY = y - 44;
    rect(qrBoxX, qrBoxY, 108, 54, 0.95);
    text("QR LINK", qrBoxX + 54, qrBoxY + 38, 8, true, "center");
    text(formatPdfCell(header.poRefNo || row.poRefNo || "-", 20), qrBoxX + 54, qrBoxY + 25, 8, false, "center");
    text("Scan from app URL", qrBoxX + 54, qrBoxY + 12, 7, false, "center");

    y -= 62;
    line(left, y, right, y, 1);
    y -= 14;

    // Supplier/company info cards
    const infoBoxH = 52;
    const infoGap = 10;
    const infoW = (right - left - infoGap) / 2;
    const supplierX = left;
    const companyX = left + infoW + infoGap;
    const infoTop = y;

    rect(supplierX, infoTop - infoBoxH, infoW, infoBoxH, 0.98);
    rect(companyX, infoTop - infoBoxH, infoW, infoBoxH, 0.98);
    text("Supplier", supplierX + 6, infoTop - 13, 9, true);
    text(formatPdfCell(supplier.supplierName || "-", 44), supplierX + 6, infoTop - 26, 9);
    text(formatPdfCell(supplier.address || "-", 56), supplierX + 6, infoTop - 38, 8);

    text("Company / Store", companyX + 6, infoTop - 13, 9, true);
    text(formatPdfCell(company.companyName || "-", 42), companyX + 6, infoTop - 26, 9);
    text(formatPdfCell(store.storeName || "-", 42), companyX + 6, infoTop - 38, 8);

    y = infoTop - infoBoxH - 16;

    // Line items table
    text("Line Items", left, y + 4, 10, true);
    const itemCols = [left, left + 28, left + 190, left + 336, left + 396, left + 471, right];
    const rowH = 16;
    const headerH = 18;
    let tableTop = y - 6;
    const maxItemRows = 16;
    const shownItems = lineItems.slice(0, maxItemRows);

    rect(itemCols[0], tableTop - headerH, itemCols[itemCols.length - 1] - itemCols[0], headerH, 0.92);
    const itemHeaders = ["#", "Product", "Specification", "Qty", "Unit Price", "Amount"];
    for (let i = 0; i < itemHeaders.length; i++) {
        line(itemCols[i], tableTop - headerH, itemCols[i], tableTop);
        const align: "left" | "center" | "right" = i >= 3 ? "right" : (i === 0 ? "center" : "left");
        const tx = align === "right" ? itemCols[i + 1] - 3 : align === "center" ? (itemCols[i] + itemCols[i + 1]) / 2 : itemCols[i] + 3;
        text(itemHeaders[i], tx, tableTop - 12, 8, true, align);
    }
    line(itemCols[itemCols.length - 1], tableTop - headerH, itemCols[itemCols.length - 1], tableTop);
    line(itemCols[0], tableTop, itemCols[itemCols.length - 1], tableTop);
    line(itemCols[0], tableTop - headerH, itemCols[itemCols.length - 1], tableTop - headerH);

    let rowTop = tableTop - headerH;
    shownItems.forEach((item: any, idx: number) => {
        const rowBottom = rowTop - rowH;
        line(itemCols[0], rowTop, itemCols[itemCols.length - 1], rowTop);
        for (let c = 0; c < itemCols.length; c++) {
            line(itemCols[c], rowBottom, itemCols[c], rowTop);
        }

        text(String(idx + 1), (itemCols[0] + itemCols[1]) / 2, rowTop - 11, 8, false, "center");
        text(formatPdfCell(item.productName || item.alternateProductName || "-", 30), itemCols[1] + 3, rowTop - 11, 8);
        text(formatPdfCell(item.specification || item.remarks || "-", 32), itemCols[2] + 3, rowTop - 11, 8);
        text(fmt(item.orderedQty ?? item.totalPcs ?? item.totalPacking ?? 0), itemCols[4] - 3, rowTop - 11, 8, false, "right");
        text(fmt(item.unitPrice ?? item.ratePerPcs ?? 0), itemCols[5] - 3, rowTop - 11, 8, false, "right");
        text(
            fmt(item.amount ?? item.totalProductAmount ?? item.productAmount ?? item.finalProductAmount ?? 0),
            itemCols[6] - 3,
            rowTop - 11,
            8,
            false,
            "right"
        );

        rowTop = rowBottom;
    });
    line(itemCols[0], rowTop, itemCols[itemCols.length - 1], rowTop);

    if (lineItems.length > shownItems.length) {
        text(`+ ${lineItems.length - shownItems.length} more line items not shown`, left, rowTop - 10, 8);
        rowTop -= 12;
    }

    y = rowTop - 16;

    // Additional costs table
    text("Additional Costs", left, y + 4, 10, true);
    const costCols = [left, left + 290, left + 420, right];
    tableTop = y - 6;
    const shownCosts = additionalCosts.slice(0, 8);
    rect(costCols[0], tableTop - headerH, costCols[costCols.length - 1] - costCols[0], headerH, 0.92);

    const costHeaders = ["Cost Type", "Amount", "VAT"];
    for (let i = 0; i < costHeaders.length; i++) {
        line(costCols[i], tableTop - headerH, costCols[i], tableTop);
        const align: "left" | "center" | "right" = i === 0 ? "left" : "right";
        const tx = align === "right" ? costCols[i + 1] - 3 : costCols[i] + 3;
        text(costHeaders[i], tx, tableTop - 12, 8, true, align);
    }
    line(costCols[costCols.length - 1], tableTop - headerH, costCols[costCols.length - 1], tableTop);
    line(costCols[0], tableTop, costCols[costCols.length - 1], tableTop);
    line(costCols[0], tableTop - headerH, costCols[costCols.length - 1], tableTop - headerH);

    rowTop = tableTop - headerH;
    shownCosts.forEach((cost: any) => {
        const rowBottom = rowTop - rowH;
        line(costCols[0], rowTop, costCols[costCols.length - 1], rowTop);
        for (let c = 0; c < costCols.length; c++) {
            line(costCols[c], rowBottom, costCols[c], rowTop);
        }

        text(
            formatPdfCell(String(cost.costType || cost.additionalCostType || "-").replaceAll("_", " "), 50),
            costCols[0] + 3,
            rowTop - 11,
            8
        );
        text(fmt(cost.amount), costCols[2] - 3, rowTop - 11, 8, false, "right");
        text(fmt(cost.vatAmount ?? 0), costCols[3] - 3, rowTop - 11, 8, false, "right");
        rowTop = rowBottom;
    });
    line(costCols[0], rowTop, costCols[costCols.length - 1], rowTop);

    y = rowTop - 16;

    // Totals box
    const totalsX = right - 188;
    const totalsW = 188;
    const totalsRows: Array<[string, string]> = [
        ["Subtotal", fmt(totals.subtotal)],
        ["Additional Costs", fmt(totals.additionalCosts)],
        ["VAT", fmt(totals.vat)],
        ["Total", `${fmt(totals.total)} ${row.currencyType || ""}`.trim()],
    ];
    const totalsTop = Math.max(y + 70, bottomSafe + 90);
    totalsRows.forEach((entry, idx) => {
        const rowTopY = totalsTop - idx * rowH;
        rect(totalsX, rowTopY - rowH, totalsW, rowH, idx === totalsRows.length - 1 ? 0.92 : undefined);
        text(entry[0], totalsX + 4, rowTopY - 11, 9, true);
        text(entry[1], totalsX + totalsW - 4, rowTopY - 11, 9, idx === totalsRows.length - 1, "right");
    });

    // Footer notes with QR URLs for app parity.
    let footerY = totalsTop - totalsRows.length * rowH - 18;
    if (footerY < bottomSafe + 32) footerY = bottomSafe + 32;
    line(left, footerY + 10, right, footerY + 10, 0.7);
    text(`QR Content: ${formatPdfCell(qrContent, 95)}`, left, footerY, 7);
    text(`QR API: ${formatPdfCell(qrApiUrl, 95)}`, left, footerY - 10, 7);

    const stream = cmds.join("\n");
    return buildPdfFromStreams([stream]);
};

export default function ApprovalScreen() {
    const route = useRoute();
    const navigation = useNavigation<ModuleNavProp>();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const { records, loading: approvalLoading } = useAppSelector((state) => state.approval);

    const params = (route.params as any) || {};
    const { title = 'Approval Details', subtitle = 'Entries queue', routeSlug = 'purchase-order' } = params;

    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // Status Modal State
    const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
    const [remarksInput, setRemarksInput] = useState("");
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
    const [isBulkPickerOpen, setIsBulkPickerOpen] = useState(false);

    // PDF Modal State
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [currentPdfData, setCurrentPdfData] = useState<string>("");
    const [currentInvoiceHtml, setCurrentInvoiceHtml] = useState<string>("");
    const [currentPdfTitle, setCurrentPdfTitle] = useState<string>("");

    useEffect(() => {
        dispatch(fetchApprovalRecords(routeSlug));
    }, [dispatch, routeSlug]);

    const sourceData = useMemo(() => {
        if (Array.isArray(records) && records.length > 0) {
            return records;
        }
        return MOCK_APPROVAL_DATA[routeSlug] || [];
    }, [records, routeSlug]);

    const effectiveLoading = isLoading || approvalLoading;

    // Filter Options Generation
    const filterOptions = useMemo(() => {
        const rawData = sourceData;
        return {
            companies: Array.from(new Set(rawData.map((i: any) => i.companyId))).filter(Boolean).map(String),
            purchaseTypes: Array.from(new Set(rawData.map((i: any) => i.purchaseType))).filter(Boolean).map(String),
            suppliers: Array.from(new Set(rawData.map((i: any) => i.supplierId))).filter(Boolean).map(String),
            departments: Array.from(new Set(rawData.map((i: any) => i.poStoreId))).filter(Boolean).map(String),
        };
    }, [sourceData]);

    // Data Filtering Logic
    const filteredData = useMemo(() => {
        const rawData = sourceData;
        const baseData = rawData.map((item: any) => ({
            ...item,
            id: item.id ?? item.sno,
            status: item.finalResponseStatus || item.statusEntry || 'PENDING'
        }));

        if (Object.keys(filters).length === 0) return baseData;

        return baseData.filter((item: any) => {
            if (filters.company && String(item.companyId) !== filters.company) return false;
            if (filters.purchaseType && filters.purchaseType !== "" && item.purchaseType !== filters.purchaseType) return false;
            if (filters.supplier && filters.supplier !== "" && item.supplierId !== filters.supplier) return false;
            if (filters.department && filters.department !== "" && item.poStoreId !== filters.department) return false;
            if (filters.poRollNo && !String(item.poRefNo).toLowerCase().includes(filters.poRollNo.toLowerCase())) return false;
            if (filters.currency && item.currencyType !== filters.currency) return false;
            if (filters.minAmount && Number(item.totalFinalProductionHdrAmount) < Number(filters.minAmount)) return false;
            if (filters.maxAmount && Number(item.totalFinalProductionHdrAmount) > Number(filters.maxAmount)) return false;

            // Date filtering
            if (filters.searchFrom) {
                const itemDate = new Date(item.poDate);
                const fromDate = new Date(filters.searchFrom);
                if (itemDate < fromDate) return false;
            }
            if (filters.searchTo) {
                const itemDate = new Date(item.poDate);
                const toDate = new Date(filters.searchTo);
                if (itemDate > toDate) return false;
            }

            return true;
        });
    }, [filters, sourceData]);

    const handleApplyFilters = (newFilters: any) => {
        setIsLoading(true);
        setFilters(newFilters);
        setTimeout(() => setIsLoading(false), 600);
    };

    const confirmStatusChange = () => {
        if (!pendingStatusUpdate || !remarksInput.trim()) return;
        setIsLoading(true);
        setTimeout(() => {
            Alert.alert("Action Successful", `${pendingStatusUpdate.ids.length} entries updated.`);
            setSelectedRows([]);
            setPendingStatusUpdate(null);
            setRemarksInput("");
            setIsRemarksModalOpen(false);
            setIsLoading(false);
        }, 1000);
    };

    const handleViewDocument = useCallback((row: any) => {
        const matchingFiles = PURCHASE_ORDER_FILES_UPLOAD.filter(
            (file: any) => file.poRefNo === row.poRefNo
        );

        if (matchingFiles.length === 0) {
            Alert.alert("Not Found", `No document found for ${row.poRefNo}`);
            return;
        }

        const selectedFile = matchingFiles.find((file: any) => file.contentType === "application/pdf");

        if (!selectedFile?.contentData) {
            Alert.alert("Empty", `Document content is missing for ${row.poRefNo}`);
            return;
        }

        setCurrentPdfData(selectedFile.contentData);
        setCurrentPdfTitle(`Document - ${row.poRefNo}`);
        setIsPdfModalOpen(true);
    }, []);

    const handleGenerateInvoicePdf = useCallback(async (row: any) => {
        setIsLoading(true);
        try {
            // ── Build template ──────────────────────────────────────
            const lineItems = PURCHASE_ORDER_DTL
                .filter((item: any) => item.poRefNo === row.poRefNo)
                .map((item: any) => {
                    const product = item.productId
                        ? PRODUCT_MASTER.find((p: any) => p.productId === item.productId)
                        : undefined;
                    const qty = Number(item.totalPcs ?? item.totalPacking ?? 0);
                    const unitPrice = Number(item.ratePerPcs ?? 0);
                    const amount = Number(
                        item.totalProductAmount ?? item.productAmount ??
                        item.finalProductAmount ?? qty * unitPrice
                    );
                    return {
                        ...item,
                        productName: (product as any)?.productName || item.alternateProductName || `Product ${item.productId ?? ''}`.trim(),
                        specification: (product as any)?.specification || item.remarks || '-',
                        orderedQty: qty, unitPrice, amount
                    };
                });

            const additionalCosts = PURCHASE_ORDER_ADDITIONAL_COST_DETAILS
                .filter((cost: any) => cost.poRefNo === row.poRefNo && cost.statusMaster === 'ACTIVE')
                .map((cost: any) => ({
                    ...cost,
                    costType: cost.additionalCostType || 'ADDITIONAL_COST',
                    vatAmount: Number(cost.vatAmount ?? 0)
                }));

            const supplier = (SUPPLIER_MASTER.find((s: any) => s.supplierId === row.supplierId) || {}) as any;
            const company = (COMPANY_MASTER.find((c: any) => c.companyId === row.companyId) || {}) as any;
            const store = (STORE_MASTER.find((s: any) => s.storeId === row.poStoreId) || {}) as any;

            const subtotal = lineItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
            const addCostTotal = additionalCosts.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
            const vat = Number(row.vatHdrAmount ?? 0);
            const total = Number(row.totalFinalProductionHdrAmount ?? subtotal + addCostTotal + vat);

            const fmt = (v: any) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const poRef = row.poRefNo || '-';
            const poDate = String(row.poDate || row.createdDate || '').split(' ')[0] || '-';

            // ── QR Code ─────────────────────────────────────────────
            const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000';
            const qrContent = `${baseUrl}/qrscan?id=%22${encodeURIComponent(poRef)}%22`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}`;

            // ── Build line items rows HTML ───────────────────────────
            const lineRowsHtml = lineItems.length === 0
                ? `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:14px 0">No line items found</td></tr>`
                : lineItems.map((item: any, idx: number) => `
                    <tr style="background:${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}">
                        <td style="padding:8px 10px;text-align:center;color:#64748b;font-size:12px">${idx + 1}</td>
                        <td style="padding:8px 10px;font-weight:600;font-size:12px;color:#1e293b">${item.productName || '-'}</td>
                        <td style="padding:8px 10px;font-size:12px;color:#475569">${item.specification || '-'}</td>
                        <td style="padding:8px 10px;text-align:right;font-size:12px;color:#1e293b">${fmt(item.orderedQty)}</td>
                        <td style="padding:8px 10px;text-align:right;font-size:12px;color:#1e293b">${fmt(item.unitPrice)}</td>
                        <td style="padding:8px 10px;text-align:right;font-weight:700;font-size:12px;color:#0f172a">${fmt(item.amount)}</td>
                    </tr>`).join('');

            const costRowsHtml = additionalCosts.length === 0
                ? `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:10px 0">No additional costs</td></tr>`
                : additionalCosts.map((cost: any, idx: number) => `
                    <tr style="background:${idx % 2 === 0 ? '#fafafa' : '#ffffff'}">
                        <td style="padding:7px 10px;font-size:12px;color:#475569">${String(cost.costType || '-').replace(/_/g, ' ')}</td>
                        <td style="padding:7px 10px;text-align:right;font-size:12px;color:#1e293b;font-weight:600">${fmt(cost.amount)}</td>
                        <td style="padding:7px 10px;text-align:right;font-size:12px;color:#64748b">${fmt(cost.vatAmount)}</td>
                    </tr>`).join('');

            // ── Generate full HTML invoice ───────────────────────────
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${poRef}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f1f5f9; padding: 0; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: #fff;
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10); }

    /* Header band */
    .header { background: linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);
               padding: 28px 32px; display: flex; justify-content: space-between;
               align-items: flex-start; }
    .header-left h1 { color:#fff; font-size:22px; font-weight:800; letter-spacing:-0.5px; }
    .header-left p  { color:#c7d2fe; font-size:12px; margin-top:4px; }
    .header-meta { color:#c7d2fe; font-size:11px; line-height:1.7; text-align:right; }
    .header-meta strong { color:#fff; }

    /* QR block */
    .qr-box { background:rgba(255,255,255,0.15); border-radius:10px;
               padding:10px; text-align:center; margin-left:16px; min-width:140px; flex-shrink:0; }
    .qr-box img { border-radius:6px; display:block; width:110px; height:110px; }
    .qr-label  { color:#e0e7ff; font-size:10px; margin-top:6px; }

    /* Info grid */
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0;
                  border-bottom:1px solid #e2e8f0; }
    .info-card { padding:20px 28px; border-right:1px solid #e2e8f0; }
    .info-card:last-child { border-right:none; }
    .info-card h3 { font-size:10px; font-weight:800; color:#94a3b8;
                     text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
    .info-card p  { font-size:13px; color:#334155; line-height:1.6; }
    .info-card .id-badge { display:inline-block; background:#ede9fe; color:#5b21b6;
                            font-size:10px; font-weight:700; padding:2px 8px;
                            border-radius:20px; margin-top:4px; }

    /* Tables */
    .section { padding:20px 28px; }
    .section h2 { font-size:13px; font-weight:800; color:#4f46e5;
                   text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px;
                   padding-bottom:8px; border-bottom:2px solid #ede9fe; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    thead th { background:#f0f0f8; padding:9px 10px; text-align:left;
                font-size:10px; font-weight:800; color:#6366f1;
                text-transform:uppercase; letter-spacing:0.6px; }
    thead th:not(:first-child) { border-left:1px solid #e2e8f0; }
    tbody tr { border-top:1px solid #f1f5f9; }
    tbody td { border-left:1px solid #f1f5f9; vertical-align:middle; }
    tbody td:first-child { border-left:none; }

    /* Totals */
    .totals { padding:0 28px 24px; }
    .totals-box { margin-left:auto; width:280px;
                   border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
    .totals-row { display:flex; justify-content:space-between; align-items:center;
                   padding:9px 16px; border-bottom:1px solid #f1f5f9; }
    .totals-row:last-child { border-bottom:none; background:linear-gradient(135deg,#4f46e5,#6366f1);
                               border-radius:0 0 10px 10px; }
    .totals-row:last-child .t-label { color:#c7d2fe; font-size:12px; font-weight:700; }
    .totals-row:last-child .t-value { color:#fff; font-size:15px; font-weight:800; }
    .t-label { font-size:11px; color:#64748b; font-weight:600; }
    .t-value { font-size:12px; color:#1e293b; font-weight:700; font-variant-numeric:tabular-nums; }

    /* Footer */
    .footer { background:#f8fafc; padding:16px 28px;
               border-top:1px solid #e2e8f0;
               display:flex; justify-content:space-between; align-items:center; }
    .footer p { font-size:10px; color:#94a3b8; }
    .stamp { border:2px solid #10b981; color:#10b981; font-size:10px;
              font-weight:800; padding:3px 10px; border-radius:4px;
              text-transform:uppercase; letter-spacing:1px; }
    @media print { body { background:white; } .page { box-shadow:none; border-radius:0; } }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>PURCHASE INVOICE</h1>
      <p>Official Purchase Order Document</p>
      <div style="margin-top:14px;" class="header-meta">
        <div><strong>PO Ref:</strong> ${poRef}</div>
        <div><strong>PO Date:</strong> ${poDate}</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        <div><strong>Currency:</strong> ${row.currencyType || 'USD'}</div>
      </div>
    </div>
    <div class="qr-box">
      <img src="${qrApiUrl}" alt="QR Code" />
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>

  <!-- Supplier / Company -->
  <div class="info-grid">
    <div class="info-card">
      <h3>Supplier</h3>
      <p style="font-weight:700;font-size:14px">${supplier.supplierName || '-'}</p>
      <p>${supplier.address || supplier.city || ''}</p>
      <span class="id-badge">${row.supplierId || ''}</span>
    </div>
    <div class="info-card">
      <h3>Company &amp; Store</h3>
      <p style="font-weight:700;font-size:14px">${company.companyName || '-'}</p>
      <p>${store.storeName || '-'}</p>
      <span class="id-badge">${row.companyId || ''}</span>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section">
    <h2>Line Items</h2>
    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">#</th>
          <th>Product</th>
          <th>Specification</th>
          <th style="text-align:right">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${lineRowsHtml}</tbody>
    </table>
  </div>

  <!-- Additional Costs -->
  <div class="section">
    <h2>Additional Costs</h2>
    <table>
      <thead>
        <tr>
          <th>Cost Type</th>
          <th style="text-align:right">Amount</th>
          <th style="text-align:right">VAT</th>
        </tr>
      </thead>
      <tbody>${costRowsHtml}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span class="t-label">Subtotal</span><span class="t-value">${fmt(subtotal)} ${row.currencyType || ''}</span></div>
      <div class="totals-row"><span class="t-label">Additional Costs</span><span class="t-value">${fmt(addCostTotal)} ${row.currencyType || ''}</span></div>
      <div class="totals-row"><span class="t-label">VAT</span><span class="t-value">${fmt(vat)} ${row.currencyType || ''}</span></div>
      <div class="totals-row"><span class="t-label">GRAND TOTAL</span><span class="t-value">${fmt(total)} ${row.currencyType || ''}</span></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>This is a system generated document &bull; ApprovalApp &bull; ${new Date().getFullYear()}</p>
    <div class="stamp">Official</div>
  </div>
</div>
</body>
</html>`;

            setCurrentInvoiceHtml(html);
            setCurrentPdfData('');
            setCurrentPdfTitle(`Invoice - ${poRef}`);
            setIsPdfModalOpen(true);
        } catch (err) {
            Alert.alert('Error', `Failed to generate invoice for ${row.poRefNo}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const columns: Column[] = useMemo(() => [
        {
            key: 'action',
            label: 'Action',
            headerAlign: 'center',
            render: (_, row, { toggleExpansion, isExpanded }) => (
                <View className="flex-row items-center gap-x-1">
                    <TouchableOpacity
                        className="p-1.5 active:bg-indigo-50 rounded-lg"
                        onPress={() => navigation.navigate('ViewDetail' as any, { id: row.id || row.sno, approvalType: routeSlug, item: row })}
                    >
                        <Eye size={18} color="#6366F1" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="p-1.5 active:bg-emerald-50 rounded-lg border border-transparent"
                        onPress={(e: any) => {
                            e?.stopPropagation?.();
                            handleViewDocument(row);
                        }}
                    >
                        <FileText size={18} color="#10B981" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="w-8 h-8 items-center justify-center active:bg-emerald-50 rounded-lg border border-transparent"
                        onPress={(e: any) => {
                            e?.stopPropagation?.();
                            handleGenerateInvoicePdf(row);
                        }}
                    >
                        <Image
                            source={require('../../assets/pdf_icon.png')}
                            className="w-5 h-5"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-1.5 active:bg-slate-100 rounded-lg">
                        <MessageSquareMore size={18} color="#64748B" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`p-1.5 rounded-lg border ${isExpanded ? 'bg-indigo-600' : 'border-transparent'}`}
                        onPress={toggleExpansion}
                    >
                        {isExpanded ? (
                            <ChevronUp size={18} color="#ffffff" strokeWidth={3} />
                        ) : (
                            <ChevronDown size={18} color="#94A3B8" strokeWidth={3} />
                        )}
                    </TouchableOpacity>
                </View>
            )
        },
        { key: 'sno', label: 'SNO', headerAlign: 'center', render: (val) => <Text className="text-[13px] font-black text-slate-800">{val}</Text> },
        {
            key: 'companyId',
            label: 'Comp ID',
            render: (val) => <Text className="text-[13px] font-bold text-slate-500">{val}</Text>
        },
        { key: 'poRefNo', label: 'PO NO', render: (val) => <Text className="text-[13px] font-black text-slate-700">{val}</Text> },
        {
            key: 'purchaseType',
            label: 'PO Type',
            render: (val) => (
                <View className={`px-2 py-0.5 rounded ${val === 'IMPORT' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                    <Text className={`text-[10px] font-black ${val === 'IMPORT' ? 'text-indigo-600' : 'text-emerald-600'}`}>{val}</Text>
                </View>
            )
        },
        {
            key: 'supplierId',
            label: 'Supplier',
            render: (val) => <Text className="text-[13px] font-black text-slate-700">{val}</Text>
        },
        {
            key: 'totalFinalProductionHdrAmount',
            label: 'Amount',
            headerAlign: 'right',
            render: (val, row) => (
                <View className="items-end">
                    <Text className="font-black text-slate-900 text-[14px]">
                        {Number(val).toLocaleString()}
                    </Text>
                    <Text className="text-[10px] font-bold text-slate-500">{row.currencyType}</Text>
                </View>
            )
        },
        {
            key: 'requestedBy',
            label: 'Requested By',
            render: (val, row) => (
                <View>
                    <Text className="text-[13px] font-black text-slate-800">{val}</Text>
                    <Text className="text-[10px] font-bold text-slate-400">{row.requestedDate}</Text>
                </View>
            )
        },
        {
            key: 'pendingDays',
            label: 'Pending Days',
            render: (_, row) => {
                // Mock calculation for pending days
                const days = Math.floor(Math.random() * 50) + 750;
                return (
                    <View className="bg-orange-100 px-2 py-1 rounded-md border border-orange-200">
                        <Text className="text-[12px] font-black text-orange-700">{days}</Text>
                    </View>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <View className="bg-yellow-100 px-2 py-1 rounded border border-yellow-200">
                    <Text className="text-[10px] font-black text-yellow-700">{val}</Text>
                </View>
            )
        },
    ], [navigation, routeSlug, handleViewDocument, handleGenerateInvoicePdf]);

    const expandedColumns: Column[] = useMemo(() => [
        { key: 'poStoreId', label: 'Dept', render: (val) => STORE_MASTER.find(s => s.storeId === val)?.storeName || val },
        { key: 'poDate', label: 'PO Date' },
    ], []);

    return (
        <View className="flex-1 bg-slate-50" >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Remarks Confirmation Modal - Same as Next.js workflow */}
            <Modal visible={isRemarksModalOpen} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center p-6">
                    <View className="bg-white rounded-xl p-6 shadow-2xl">
                        <View className="flex-row items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <Text className="text-xl font-bold text-slate-800 tracking-tight">Status Confirmation</Text>
                            <TouchableOpacity onPress={() => setIsRemarksModalOpen(false)}>
                                <XCircle size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-6">
                            <Text className="text-slate-500 font-bold mb-4">
                                You are about to mark <Text className="text-indigo-600">{pendingStatusUpdate?.ids.length} requests</Text> as <Text className="text-indigo-600">{pendingStatusUpdate?.status}</Text>.
                            </Text>

                            <Text className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-2">Remarks / Comments <Text className="text-rose-500">*</Text></Text>
                            <TextInput
                                value={remarksInput}
                                onChangeText={setRemarksInput}
                                placeholder="Enter mandatory remarks..."
                                multiline
                                numberOfLines={4}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-semibold h-32"
                                textAlignVertical="top"
                            />
                        </View>

                        <View className="flex-row items-center justify-end space-x-3">
                            <TouchableOpacity
                                onPress={() => setIsRemarksModalOpen(false)}
                                className="px-5 py-2.5 rounded-lg"
                            >
                                <Text className="text-slate-500 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmStatusChange}
                                disabled={!remarksInput.trim() || isLoading}
                                className={`px-6 py-2.5 rounded-lg bg-indigo-600 flex-row items-center shadow-lg shadow-indigo-100 ${(!remarksInput.trim() || isLoading) ? 'opacity-50' : ''}`}
                            >
                                <Text className="text-white font-bold mr-2">Confirm Update</Text>
                                {isLoading && <RefreshCw size={14} color="white" className="animate-spin" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Filter Form - Applying Next.js design */}
                <FilterForm
                    filters={filters}
                    filterOptions={filterOptions}
                    onApplyFilters={handleApplyFilters}
                    onReset={() => setFilters({})}
                    isLoading={effectiveLoading}
                    title={`Filter Approval Requests`}
                />

                {/* Performance & Totals Summary - Next.js Styled Analytics Bar */}
                <View className="px-4 mb-6">
                    <View className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="h-10 w-10 rounded-xl bg-white/20 items-center justify-center mr-4">
                                <FileText size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                            <View>
                                <Text className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Selected Queue</Text>
                                <Text className="text-white text-lg font-black">{filteredData.length} <Text className="text-indigo-200 text-xs font-bold capitalize">{routeSlug.replace('-', ' ')}</Text></Text>
                            </View>
                        </View>

                        <View className="h-10 w-px bg-white/10 mx-2" />

                        <View className="flex-row items-center">
                            <View className="h-10 w-10 rounded-xl bg-white/20 items-center justify-center mr-4">
                                <Zap size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                            <View>
                                <Text className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Total Value</Text>
                                <Text className="text-white text-lg font-black">
                                    {filteredData.reduce((acc, curr) => acc + Number(curr.totalFinalProductionHdrAmount || 0), 0).toLocaleString()}
                                    <Text className="text-indigo-200 text-xs font-medium"> USD</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* DataTable - Applying Next.js colors and layout */}
                <DataTable
                    title={title}
                    subTitle={`${filteredData.length} records found`}
                    data={filteredData}
                    columns={columns}
                    rowKey="id"
                    isLoading={effectiveLoading}
                    totalRows={filteredData.length}
                    exportOptions={{
                        enabled: true,
                        formats: ['csv', 'excel', 'pdf']
                    }}
                    pagination={{
                        enabled: true,
                        currentPage: 1,
                        itemsPerPage: 10
                    }}
                    selection={{
                        enabled: true,
                        selectedRows: selectedRows,
                        onSelectedRowsChange: setSelectedRows
                    }}
                    expansion={{
                        enabled: true,
                        expandedRows: expandedRows,
                        expandedColumns: expandedColumns,
                        onExpandedRowsChange: setExpandedRows,
                        hideExpansionColumn: true
                    }}
                    bulkActions={(ids) => (
                        <View>
                            <TouchableOpacity
                                onPress={() => setIsBulkPickerOpen(!isBulkPickerOpen)}
                                className="bg-white rounded px-3 py-1.5 flex-row items-center justify-between"
                            >
                                <Text className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mr-2">Change Status</Text>
                                <ChevronDown size={14} color="#4F46E5" />
                            </TouchableOpacity>
                            {isBulkPickerOpen && (
                                <View className="absolute bottom-10 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 w-48">
                                    {[
                                        { label: 'Mark Pending', value: 'PENDING' },
                                        { label: 'Approve Selected', value: 'APPROVED' },
                                        { label: 'Reject Selected', value: 'REJECTED' },
                                        { label: 'Put on Hold', value: 'HOLD' },
                                    ].map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => {
                                                setPendingStatusUpdate({ ids, status: opt.value as any });
                                                setRemarksInput("");
                                                setIsRemarksModalOpen(true);
                                                setIsBulkPickerOpen(false);
                                            }}
                                            className="p-3 border-b border-slate-50 active:bg-indigo-50"
                                        >
                                            <Text className="text-[11px] font-bold text-slate-700 uppercase">{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                    toolbarActions={
                        <TouchableOpacity
                            onPress={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); }}
                            className="p-2 border border-slate-200 rounded-lg text-slate-600"
                        >
                            <RefreshCw size={18} color="#64748B" />
                        </TouchableOpacity>
                    }
                />
            </ScrollView>

            {/* PDF Viewer Modal – uploaded document */}
            <PdfViewerModal
                isOpen={isPdfModalOpen && !currentInvoiceHtml}
                onClose={() => { setIsPdfModalOpen(false); }}
                pdfData={currentPdfData}
                title={currentPdfTitle}
            />

            {/* Invoice HTML Viewer Modal – generated invoice */}
            <PdfViewerModal
                isOpen={isPdfModalOpen && !!currentInvoiceHtml}
                onClose={() => { setIsPdfModalOpen(false); setCurrentInvoiceHtml(''); }}
                htmlContent={currentInvoiceHtml}
                title={currentPdfTitle}
            />
        </View>
    );
}
