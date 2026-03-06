"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
//app/[approvalType]/page.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import FilterForm from "../components/ApprovalDetails/FilterForm";
import DataTable, { Column } from "../components/ApprovalDetails/DataTable";
import {
    Eye,
    ChevronDown,
    XCircle,
    RefreshCw,
    Settings,
    FileText,
    MessageSquareMore
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import ExpandableText from "../components/ExpandableText";

import PdfViewerModal from "../components/ApprovalDetails/PdfViewerModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchApprovalRecords } from "@/redux/slices/approvalSlice";

interface ApprovalDetailsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type PendingStatusUpdate = {
    ids: number[];
    status: "PENDING" | "APPROVED" | "REJECTED" | "HOLD";
};

// Mock data
import {
    DASHBOARD_CARDS,
    PURCHASE_ORDER_FILES_UPLOAD,
    INVOICE_TEMPLATE_DATA,
    PURCHASE_ORDER_DTL,
    PURCHASE_ORDER_ADDITIONAL_COST_DETAILS,
    PRODUCT_MASTER,
    SUPPLIER_MASTER,
    COMPANY_MASTER,
    STORE_MASTER
} from "../config/mockData";


// Main Table columns
function getTableColumns(
    approvalType: string,
    onViewDetails: (row: any) => void,
    onViewDocument: (row: any) => void,
    onGenerateInvoicePdf: (row: any) => void | Promise<void>,
    onViewConversation: (row: any) => void
): Column[] {
    const nType = (approvalType || '').toLowerCase();
    const isPO = nType === 'purchase-order';
    const isWO = nType === 'work-order';
    const isPA = nType === 'price-approval';
    const isSR = nType === 'sales-return-approval';

    const refLabel = isPO ? 'PO NO' : isWO ? 'WO NO' : isPA ? 'PA NO' : isSR ? 'SR NO' : 'REF NO';
    const typeLabel = isPO ? 'PO Type' : isWO ? 'WO Type' : isPA ? 'Price Type' : isSR ? 'SR Type' : 'Type';

    return [
        {
            key: 'action',
            label: 'Action',
            headerAlign: 'center',
            width: '180px',
            render: (_: any, row: any, { isExpanded, toggleExpansion }: any) => (
                <div className="flex items-center justify-center space-x-1.5 min-w-[160px]">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shrink-0"
                        title="View Details"
                    >
                        <Eye size={16} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDocument(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200 shrink-0"
                        title="View Document"
                    >
                        <FileText size={16} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onGenerateInvoicePdf(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200 shrink-0"
                        title="Generate PDF"
                    >
                        <Image
                            src="/pdf_icon.png"
                            alt="PDF"
                            width={16}
                            height={16}
                            className="block w-4 h-4 object-contain"
                        />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewConversation(row);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100 shrink-0"
                        title="Conversation"
                    >
                        <MessageSquareMore size={16} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={toggleExpansion}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all border shrink-0 ${isExpanded
                            ? 'bg-indigo-600 text-white border-indigo-600 rotate-180'
                            : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                            }`}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        <ChevronDown size={14} strokeWidth={3} />
                    </button>
                </div>
            )
        },
        { key: 'sno', label: 'SNO', render: (val: number) => <span className="font-bold text-slate-800">{val}</span> },
        { key: 'companyId', label: 'Comp ID', render: (val: number) => <span className="text-slate-500 font-semibold">{val}</span> },
        { key: 'poRefNo', label: refLabel, render: (value: string) => <span className="text-[13px] font-bold text-slate-700">{value}</span> },
        {
            key: 'purchaseType', label: typeLabel, render: (value: string) => (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-100 text-emerald-700">
                    {value}
                </span>
            )
        },
        { key: 'supplierId', label: 'Supplier', render: (value: string) => <span className="text-[12px] font-bold text-slate-700 leading-tight uppercase max-w-[150px] block">{value}</span> },
        { key: 'poStoreId', label: 'Dept', responsiveClass: 'hidden md:table-cell' },
        { key: 'totalFinalProductionHdrAmount', label: 'Amount', render: (value: number, row: any) => <span className="font-black text-slate-900 text-[14px]">{value?.toLocaleString()} {row.currencyType}</span> },
        {
            key: 'requestedBy',
            label: 'Requested By',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-700 text-[11px] font-bold">{row.requestedBy}</span>
                    <span className="text-slate-400 text-[10px]">{row.requestedDate?.split(' ')[0]}</span>
                </div>
            )
        },
        {
            key: 'pendingDays', label: 'Pending Days', render: (_: any, row: any) => {
                const created = new Date(row.createdDate || new Date());
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - created.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                    <div className="flex justify-center">
                        <div className="w-7 h-7 bg-amber-100 text-amber-700 flex items-center justify-center rounded font-bold transition-transform hover:scale-110">
                            {diffDays}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'finalResponseStatus',
            label: 'Status',
            render: (val: string) => (
                <span className={`px-2 py-1 text-[10px] font-bold rounded ${val === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {val}
                </span>
            )
        }
    ];
}

const ApprovalDetailsPage = ({ searchParams }: ApprovalDetailsPageProps) => {
    const router = useRouter();
    const params = useParams();
    const dispatch = useAppDispatch();
    const approvalType = (params?.approvalType as string) || "";

    const { records, loading: recordsLoading } = useAppSelector((state: any) => state.approval);

    // Get query parameters from URL
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});
    const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
    const [remarksInput, setRemarksInput] = useState("");
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [currentPdfData, setCurrentPdfData] = useState<string>("");
    const [currentPdfTitle, setCurrentPdfTitle] = useState<string>("");



    useEffect(() => {
        if (!searchParams) return;
        // Convert Promise to actual values
        searchParams.then((params) => {
            if (!params) return;
            const paramsObj: Record<string, string> = {};
            Object.entries(params).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    paramsObj[key] = value;
                }
            });
            setQueryParams(paramsObj);
        });
    }, [searchParams]);

    const [filters, setFilters] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    useEffect(() => {
        if (approvalType) {
            dispatch(fetchApprovalRecords(approvalType));
        }
    }, [dispatch, approvalType]);

    const confirmStatusChange = () => {
        if (!pendingStatusUpdate || !remarksInput.trim()) return;

        setIsLoading(true);

        setTimeout(() => {
            toast.success(
                `${pendingStatusUpdate.ids.length} request(s) marked as ${pendingStatusUpdate.status}`
            );

            setSelectedRows([]);
            setPendingStatusUpdate(null);
            setRemarksInput("");
            setIsRemarksModalOpen(false);
            setIsLoading(false);
        }, 800);
    };

    const handleViewConversation = React.useCallback((row: any) => {
        router.push(`/${approvalType}/conversation?poRefNo=${row.poRefNo}`);
    }, [router, approvalType]);


    const handleViewDocument = React.useCallback((row: any) => {
        const matchingFiles = PURCHASE_ORDER_FILES_UPLOAD.filter(
            (file: any) => file.poRefNo === row.poRefNo && file.statusMaster === "ACTIVE"
        );

        if (matchingFiles.length === 0) {
            toast.error(`No document found for ${row.poRefNo}`);
            return;
        }

        const selectedFile =
            matchingFiles.find((file: any) => file.fileType === "INVOICE" && file.contentType === "application/pdf") ||
            matchingFiles.find((file: any) => file.contentType === "application/pdf");

        if (!selectedFile?.contentData) {
            toast.error(`Document content is missing for ${row.poRefNo}`);
            return;
        }

        try {
            setCurrentPdfData(selectedFile.contentData);
            setCurrentPdfTitle(`Document - ${row.poRefNo}`);
            setIsPdfModalOpen(true);

            toast.success(`Opening document for ${row.poRefNo}...`);
        } catch {
            toast.error(`Failed to open document for ${row.poRefNo}`);
        }
    }, []);

    const handleGenerateInvoicePdf = React.useCallback(async (row: any) => {
        const buildTemplateFromRow = (poRow: any) => {
            const lineItems = PURCHASE_ORDER_DTL
                .filter((item: any) => item.poRefNo === poRow.poRefNo)
                .map((item: any) => {
                    const product = item.productId
                        ? PRODUCT_MASTER.find((p: any) => p.productId === item.productId)
                        : undefined;
                    const qty = Number(item.totalPcs ?? item.totalPacking ?? 0);
                    const unitPrice = Number(item.ratePerPcs ?? 0);
                    const amount = Number(
                        item.totalProductAmount ??
                        item.productAmount ??
                        item.finalProductAmount ??
                        qty * unitPrice
                    );

                    return {
                        ...item,
                        productName: product?.productName || item.alternateProductName || `Product ${item.productId ?? ""}`.trim(),
                        specification: product?.specification || item.remarks || "-",
                        orderedQty: qty,
                        unitPrice,
                        amount
                    };
                });

            const additionalCosts = PURCHASE_ORDER_ADDITIONAL_COST_DETAILS
                .filter((cost: any) => cost.poRefNo === poRow.poRefNo && cost.statusMaster === "ACTIVE")
                .map((cost: any) => ({
                    ...cost,
                    costType: cost.additionalCostType || "ADDITIONAL_COST",
                    vatAmount: Number(cost.vatAmount ?? 0)
                }));

            const subtotal = lineItems.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
            const addCostTotal = additionalCosts.reduce((sum: number, cost: any) => sum + Number(cost.amount || 0), 0);
            const vatFromItems = lineItems.reduce((sum: number, item: any) => sum + Number(item.vatAmount || 0), 0);
            const vat = Number(poRow.vatHdrAmount ?? vatFromItems ?? 0);
            const total = Number(poRow.totalFinalProductionHdrAmount ?? subtotal + addCostTotal + vat);

            return {
                header: {
                    poRefNo: poRow.poRefNo,
                    poDate: String(poRow.poDate || poRow.createdDate || "").split(" ")[0] || "-",
                    supplier: SUPPLIER_MASTER.find((s: any) => s.supplierId === poRow.supplierId),
                    company: COMPANY_MASTER.find((c: any) => c.companyId === poRow.companyId),
                    store: STORE_MASTER.find((s: any) => s.storeId === poRow.poStoreId)
                },
                lineItems,
                additionalCosts,
                totals: {
                    subtotal,
                    additionalCosts: addCostTotal,
                    vat,
                    total
                }
            };
        };

        const template =
            (INVOICE_TEMPLATE_DATA as Record<string, any>)[row.poRefNo] ||
            buildTemplateFromRow(row);

        if (!template?.header?.poRefNo) {
            toast.error(`Unable to build invoice template for ${row.poRefNo}`);
            return;
        }

        try {
            const [{ jsPDF }, autoTableModule] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable")
            ]);

            const autoTable = autoTableModule.default;
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 12;
            const right = pageWidth - margin;

            const header = template.header || {};
            const supplier = header.supplier || {};
            const company = header.company || {};
            const store = header.store || {};
            const lineItems: any[] = template.lineItems || [];
            const additionalCosts: any[] = template.additionalCosts || [];
            const totals = template.totals || {};

            const fmt = (value: any) =>
                Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Dynamically generate QR Code URL
            const qrId = header.poRefNo || row.poRefNo;
            const qrContent = `${process.env.NEXT_PUBLIC_APP_URL}qrscan?id=%22${qrId}%22`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`;

            // Load QR Image before drawing
            const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("QR Load Failed"));
                img.src = qrApiUrl;
            });

            // Draw QR Code (Top Right)
            doc.addImage(qrImg, "PNG", right - 25, 8, 25, 25);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("PURCHASE INVOICE", margin, 14);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`PO Ref: ${header.poRefNo || row.poRefNo || "-"}`, margin, 21);
            doc.text(`PO Date: ${header.poDate || "-"}`, margin, 26);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 31);

            doc.setFont("helvetica", "bold");
            doc.text("Supplier", margin, 38);
            doc.text("Company / Store", right - 70, 38);
            doc.setFont("helvetica", "normal");
            doc.text(String(supplier.supplierName || "-"), margin, 43);
            doc.text(String(company.companyName || "-"), right - 70, 43);
            doc.text(String(store.storeName || "-"), right - 70, 48);

            autoTable(doc, {
                startY: 55,
                head: [["#", "Product", "Specification", "Qty", "Unit Price", "Amount"]],
                body: lineItems.map((item: any, index: number) => [
                    index + 1,
                    item.productName || item.alternateProductName || "-",
                    item.specification || item.remarks || "-",
                    fmt(item.orderedQty ?? item.totalPcs ?? item.totalPacking ?? 0),
                    fmt(item.unitPrice ?? item.ratePerPcs ?? 0),
                    fmt(item.amount ?? item.totalProductAmount ?? item.productAmount ?? item.finalProductAmount ?? 0)
                ]),
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [15, 23, 42] },
                columnStyles: {
                    0: { halign: "center", cellWidth: 10 },
                    3: { halign: "right", cellWidth: 20 },
                    4: { halign: "right", cellWidth: 26 },
                    5: { halign: "right", cellWidth: 26 }
                }
            });

            const lineItemsEndY = (doc as any).lastAutoTable?.finalY || 70;

            autoTable(doc, {
                startY: lineItemsEndY + 6,
                head: [["Cost Type", "Amount", "VAT"]],
                body: additionalCosts.map((cost: any) => [
                    String(cost.costType || cost.additionalCostType || "-").replaceAll("_", " "),
                    fmt(cost.amount),
                    fmt(cost.vatAmount ?? 0)
                ]),
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [30, 64, 175] },
                columnStyles: {
                    1: { halign: "right", cellWidth: 30 },
                    2: { halign: "right", cellWidth: 30 }
                }
            });

            const costsEndY = (doc as any).lastAutoTable?.finalY || lineItemsEndY + 20;

            autoTable(doc, {
                startY: costsEndY + 6,
                margin: { left: right - 78 },
                body: [
                    ["Subtotal", fmt(totals.subtotal)],
                    ["Additional Costs", fmt(totals.additionalCosts)],
                    ["VAT", fmt(totals.vat)],
                    ["Total", fmt(totals.total)]
                ],
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2.5 },
                columnStyles: {
                    0: { fontStyle: "bold", cellWidth: 45 },
                    1: { halign: "right", cellWidth: 33 }
                }
            });

            const pdfOutput = doc.output('datauristring');
            setCurrentPdfData(pdfOutput);
            setCurrentPdfTitle(`Invoice - ${header.poRefNo || row.poRefNo || "Document"}`);
            setIsPdfModalOpen(true);

            toast.success(`PDF generated for ${row.poRefNo}`);
        } catch {
            toast.error(`Failed to generate PDF for ${row.poRefNo}`);
        }
    }, []);

    // Get page title from query params or from route
    const pageTitle = useMemo(() => {
        // 1. Try to get from query params (passed from dashboard if any)
        if (queryParams.cardTitle) {
            return queryParams.cardTitle;
        }

        // 2. Try to get from DASHBOARD_CARDS configuration dynamically
        const card = DASHBOARD_CARDS.find(c => c.routeSlug === approvalType);
        if (card) return card.cardTitle;

        // 3. Fallback to route-based formatting
        if (!approvalType) return "Approval Details";
        return approvalType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }, [approvalType, queryParams]);

    // Combined Data Filtering logic
    const filteredData = useMemo(() => {
        const rawData = records || [];

        // Map raw data to include calculated fields
        const data = rawData.map((item: any) => {
            const created = new Date(item.createdDate || new Date());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                ...item,
                id: item.sno, // Map sno to id for compatibility
                pendingDays: diffDays,
                amount: item.totalFinalProductionHdrAmount // Map for filters compatibility
            };
        });

        if (Object.keys(filters).length === 0) return data;

        return data.filter((item: any) => {
            // 1. Company Filter
            if (filters.company && item.companyId?.toString() !== filters.company) return false;

            // 2. Purchase Type Filter
            if (filters.purchaseType && filters.purchaseType !== 'all' && item.purchaseType?.toLowerCase() !== filters.purchaseType.toLowerCase()) return false;

            // 3. Supplier Filter
            if (filters.supplier && filters.supplier !== 'all') {
                const supplierMatch = item.supplierId?.toString().includes(filters.supplier);
                if (!supplierMatch) return false;
            }

            // 4. Department Filter
            if (filters.department && filters.department !== 'all') {
                const deptMatch = item.poStoreId?.toString().includes(filters.department);
                if (!deptMatch) return false;
            }

            // 5. Status Filter
            if (filters.status && filters.status !== 'all') {
                const itemStatus = (item.finalResponseStatus || 'PENDING').toLowerCase();
                if (itemStatus !== filters.status.toLowerCase()) return false;
            }

            // 6. PO Number / Roll No Search
            if (filters.poRollNo && !item.poRefNo.toLowerCase().includes(filters.poRollNo.toLowerCase())) return false;

            // 7. Currency Filter
            if (filters.currency && item.currencyType !== filters.currency) return false;

            // 8. Amount Range Filters
            if (filters.minAmount || filters.maxAmount) {
                const numericAmount = item.totalFinalProductionHdrAmount;
                if (filters.minAmount && numericAmount < parseFloat(filters.minAmount)) return false;
                if (filters.maxAmount && numericAmount > parseFloat(filters.maxAmount)) return false;
            }

            return true;
        });
    }, [filters, approvalType, records]);

    const handleApplyFilters = (newFilters: any) => {
        setIsLoading(true);
        setFilters(newFilters);
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleResetFilters = () => {
        setFilters({});
        toast('Filters cleared', { icon: '🧹' });
    };

    const handleViewDetails = React.useCallback((row: any) => {
        // Pass query params to detail page
        const queryString = new URLSearchParams(queryParams).toString();
        const query = queryString ? `?${queryString}` : '';

        // Clean URL: removed /approval
        router.push(`/${approvalType}/${row.id}${query}`, {
            scroll: false,
        });
    }, [approvalType, router, queryParams]);

    const tableColumns = useMemo(
        () => getTableColumns(approvalType, handleViewDetails, handleViewDocument, handleGenerateInvoicePdf, handleViewConversation),
        [approvalType, handleViewDetails, handleViewDocument, handleGenerateInvoicePdf, handleViewConversation]
    );

    return (
        <>
            <PdfViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                pdfData={currentPdfData}
                title={currentPdfTitle}
            />

            <div className="min-h-screen bg-transparent pb-10">
                <div className="w-full space-y-6">

                    {/* Advanced Filter Component */}
                    <FilterForm
                        filters={filters}
                        onFilterChange={setFilters}
                        onApplyFilters={handleApplyFilters}
                        onReset={handleResetFilters}
                        isLoading={isLoading}
                        title={`Filter ${pageTitle} Requests`}
                        filterOptions={useMemo(() => {
                            const rawData = records || [];
                            return {
                                companies: Array.from(new Set(rawData.map((i: any) => i.companyId))).filter(Boolean).map(String),
                                purchaseTypes: Array.from(new Set(rawData.map((i: any) => i.purchaseType))).filter(Boolean).map(String),
                                suppliers: Array.from(new Set(rawData.map((i: any) => i.supplierId))).filter(Boolean).map(String),
                                departments: Array.from(new Set(rawData.map((i: any) => i.poStoreId))).filter(Boolean).map(String)
                            };
                        }, [records])}
                    />

                    {/* Dynamic Data Table Implementation */}
                    <DataTable
                        title={`${pageTitle} Analysis`}
                        subTitle={`Active View`}
                        data={filteredData}
                        totalRows={filteredData.length}
                        columns={tableColumns}
                        isLoading={isLoading || recordsLoading}
                        showSearch={true}
                        onSearch={() => { }}
                        // Export Configuration
                        exportOptions={{
                            enabled: true,
                            formats: ['csv', 'excel', 'pdf'],
                            onExport: (format) => {
                                const dataToExport = selectedRows.length > 0
                                    ? filteredData.filter((item: any) => selectedRows.includes(item.id))
                                    : filteredData;

                                if (format === 'csv' || format === 'excel') {
                                    // Simple CSV key-value dump
                                    const headers = tableColumns.map(c => c.label).join(',');
                                    const rows = dataToExport.map((row: any) =>
                                        tableColumns.map(c => {
                                            const val = row[c.key as keyof typeof row];
                                            return typeof val === 'string' ? `"${val}"` : val;
                                        }).join(',')
                                    ).join('\n');

                                    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `${pageTitle}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success(`Exported ${dataToExport.length} records to ${format.toUpperCase()}`);
                                } else if (format === 'pdf') {
                                    toast("Generating PDF...", { icon: '📄' });

                                    Promise.all([
                                        import('jspdf'),
                                        import('jspdf-autotable')
                                    ]).then(([jsPDFModule, autoTableModule]) => {
                                        const jsPDF = jsPDFModule.default;
                                        const autoTable = autoTableModule.default;
                                        const doc: any = new jsPDF();

                                        // 1. Header Section
                                        doc.setFontSize(18);
                                        doc.setTextColor(40, 40, 40);
                                        doc.text("Approval Requests Report", 14, 20);

                                        doc.setFontSize(10);
                                        doc.setTextColor(100, 100, 100);
                                        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
                                        doc.text(`Category: ${pageTitle}`, 14, 33);

                                        // 2. Define Columns & Rows
                                        const exportableColumns = tableColumns.filter(c => c.key !== 'action');
                                        const tableHead = exportableColumns.map(c => c.label);

                                        const tableBody = dataToExport.map((row: any) => {
                                            return exportableColumns.map(c => {
                                                const val = row[c.key as keyof typeof row];
                                                if (val === null || val === undefined) return '';
                                                return String(val);
                                            });
                                        });

                                        // 3. Generate Table
                                        autoTable(doc, {
                                            head: [tableHead],
                                            body: tableBody,
                                            startY: 40,
                                            theme: 'grid',
                                            styles: {
                                                fontSize: 8,
                                                cellPadding: 3,
                                                overflow: 'linebreak'
                                            },
                                            headStyles: {
                                                fillColor: [79, 70, 229], // Indigo-600 to match theme
                                                textColor: 255,
                                                fontStyle: 'bold'
                                            },
                                            didDrawPage: (data: any) => {
                                                const str = 'Page ' + doc.internal.getNumberOfPages();
                                                doc.setFontSize(8);
                                                const pageSize = doc.internal.pageSize;
                                                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                doc.text(str, data.settings.margin.left, pageHeight - 10);
                                            }
                                        });

                                        // 4. Save
                                        doc.save(`${pageTitle}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                                        toast.success("PDF Downloaded successfully");
                                    }).catch(err => {
                                        console.error("PDF Generation Error:", err);
                                        toast.error("Failed to generate PDF. Please try again.");
                                    });
                                }
                            }
                        }}

                        // Custom Toolbar Actions
                        selection={{
                            enabled: true,
                            selectedRows,
                            onSelectedRowsChange: setSelectedRows
                        }}

                        // Expansion Configuration
                        expansion={{
                            enabled: true,
                            expandedRows,
                            hideExpansionColumn: true,
                            onExpandedRowsChange: setExpandedRows,
                            renderExpansion: (row: any) => (
                                <div className="flex flex-col space-y-6 px-4 py-6 bg-slate-50/30 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-500">

                                    {/* --- Section 1: Request DNA (Metadata Summary) --- */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-x-12 gap-y-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization Unit</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                                <span className="text-[14px] font-bold text-slate-800">{row.companyId}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-100 pl-8">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Axis</span>
                                            <p className="text-[14px] font-bold text-slate-800 uppercase">{row.currencyType} Base</p>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-100 pl-8">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Dept</span>
                                            <p className="text-[14px] font-bold text-slate-800">{row.poStoreId}</p>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-100 pl-8">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Record ID</span>
                                            <p className="text-[14px] font-bold text-slate-800">#{row.sno?.toString().padStart(4, '0')}</p>
                                        </div>
                                    </div>

                                    {/* --- Section 2: Workflow Lifecycle (Dual Tracking) --- */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Enhanced Response 1 Log */}
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">01</div>
                                                    <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Technical Review</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response1Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                    }`}>
                                                    {row.response1Status || "AWAITING"}
                                                </span>
                                            </div>

                                            <div className="p-5 space-y-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                        <Eye className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reviewing Authority</p>
                                                        <p className="text-[14px] font-bold text-slate-800">{row.response1Person || "Not Initiated"}</p>
                                                    </div>
                                                </div>

                                                <div className="relative pl-4 border-l-2 border-slate-100 py-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Audit Remarks</p>
                                                    <div className="text-[13px] text-slate-600 leading-relaxed font-medium capitalize italic">
                                                        "<ExpandableText text={row.response1Remarks || "Pending technical validation of specific line items and supplier terms."} limit={100} />"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Response 2 Log */}
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">02</div>
                                                    <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Executive Decision</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response2Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                    }`}>
                                                    {row.response2Status || "PENDING"}
                                                </span>
                                            </div>

                                            <div className="p-5 space-y-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                        <Settings className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approving Authority</p>
                                                        <p className="text-[14px] font-bold text-slate-800">{row.response2Person || "Final Tier Pending"}</p>
                                                    </div>
                                                </div>

                                                <div className="relative pl-4 border-l-2 border-slate-100 py-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Final Remarks</p>
                                                    <div className="text-[13px] text-slate-600 leading-relaxed font-medium capitalize italic">
                                                        "<ExpandableText text={row.response2Remarks || "Awaiting final sign-off from the department head to execute procurement."} limit={100} />"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }}

                        // Custom Toolbar Actions
                        toolbarActions={(
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        setIsLoading(true);
                                        setTimeout(() => setIsLoading(false), 800);
                                    }}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all shadow-sm active:rotate-180 duration-500"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 shadow-sm">
                                    <Settings size={16} />
                                </button>
                            </div>
                        )}

                        // Bulk Actions Implementation
                        bulkActions={(ids: number[]) => (
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm">
                                    <select
                                        id="bulk-status-select"
                                        className="bg-transparent text-xs font-bold text-slate-700 py-1 pl-3 pr-8 outline-none border-none focus:ring-0 cursor-pointer"
                                        defaultValue=""
                                        onChange={(e) => {
                                            const status = e.target.value;
                                            if (!status || ids.length === 0) return;

                                            setPendingStatusUpdate({
                                                ids: [...ids],
                                                status: status as PendingStatusUpdate["status"]
                                            });

                                            setRemarksInput("");
                                            setIsRemarksModalOpen(true);

                                            // Reset dropdown back to placeholder
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="" disabled>Change Status To...</option>
                                        <option value="PENDING">Mark as Pending</option>
                                        <option value="APPROVED">Approve Selected</option>
                                        <option value="REJECTED">Reject Selected</option>
                                        <option value="HOLD">Put on Hold</option>
                                    </select>

                                </div>
                            </div>
                        )}

                        useInternalState={{
                            selection: false,
                            expansion: false,
                            pagination: true,
                            sorting: true
                        }}
                    />
                </div >

            </div >
            {isRemarksModalOpen && (
                <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-800">Status Confirmation</h3>
                            <button
                                onClick={() => setIsRemarksModalOpen(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-slate-500 font-medium">
                                You are about to mark <span className="text-indigo-600 font-bold">{pendingStatusUpdate?.ids?.length} request(s)</span> as <span className={`font-bold ${pendingStatusUpdate?.status === 'APPROVED' ? 'text-emerald-600' : pendingStatusUpdate?.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>{pendingStatusUpdate?.status}</span>.
                            </p>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Remarks / Comments <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={remarksInput}
                                    onChange={(e) => setRemarksInput(e.target.value)}
                                    placeholder="Enter mandatory remarks for this action..."
                                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setIsRemarksModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={!remarksInput.trim()}
                                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center space-x-2"
                            >
                                <span>Confirm Update</span>
                                {isLoading && <RefreshCw size={14} className="animate-spin" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <PdfViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                pdfData={currentPdfData}
                title={currentPdfTitle}
            />
        </>
    );
};

export default ApprovalDetailsPage;
