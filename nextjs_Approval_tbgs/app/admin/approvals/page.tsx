"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import {
    Eye,
    ChevronDown,
    XCircle,
    RefreshCw,
    Settings,
    FileText,
    MessageSquareMore,
    Loader2
} from "lucide-react";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '@/redux/hooks';
import { fetchDashboardCards } from '@/redux/slices/dashboardSlice';
import FilterForm from '../../components/ApprovalDetails/FilterForm';
import DataTable, { Column } from '../../components/ApprovalDetails/DataTable';
import ExpandableText from '../../components/ExpandableText';
import PdfViewerModal from '../../components/ApprovalDetails/PdfViewerModal';
import Image from "next/image";

const AVAILABLE_ICONS = [
    "LayoutDashboard", "ShoppingCart", "Briefcase", "Settings", "Package", "Building2",
    "Users", "CreditCard", "DollarSign", "Zap", "Truck", "FileText",
    "Inbox", "Bell", "MessageCircle", "Phone", "Key", "Lock", "Shield", "Activity",
    "BarChart2", "PieChart", "TrendingUp", "Search", "Filter", "Globe", "Calendar",
    "Clock", "Archive", "Home", "User", "Layers", "Database", "HardDrive", "Server",
    "Cloud", "Link", "Paperclip", "Map", "MapPin", "Flag", "Bookmark", "Star",
    "Heart", "Camera", "Image", "Video", "Music", "Wifi", "Battery",
    "Cpu", "MousePointer2", "Target", "Trophy", "Award", "Coffee", "Anchor",
    "Plane", "Ship", "Sun", "Moon", "Snowflake", "Flame", "Droplets",
    "List", "ClipboardCheck", "Wallet", "Banknote", "Ticket", "Percent", "Gift",
    "HeartHandshake", "Handshake", "Scale", "Globe2", "Compass", "Navigation",
    "Stethoscope", "Syringe", "Microscope", "FlaskConical", "Dna", "HeartPulse",
    "Wrench", "Hammer", "Paintbucket", "Lightbulb", "Book", "BookOpen", "GraduationCap"
];

const THEME_MAP = [
    { id: 'indigo', name: 'Indigo Depth', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', activeBg: 'bg-indigo-600' },
    { id: 'emerald', name: 'Emerald Forest', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', activeBg: 'bg-emerald-600' },
    { id: 'amber', name: 'Amber Glow', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', activeBg: 'bg-amber-600' },
    { id: 'rose', name: 'Rose Velvet', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', activeBg: 'bg-rose-600' },
    { id: 'sky', name: 'Sky Crystal', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', activeBg: 'bg-sky-600' },
    { id: 'violet', name: 'Violet Myst', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', activeBg: 'bg-violet-600' },
    { id: 'blue', name: 'Blue Ocean', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', activeBg: 'bg-blue-600' },
    { id: 'cyan', name: 'Cyan Glow', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', activeBg: 'bg-cyan-600' },
    { id: 'teal', name: 'Teal Lagoon', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', activeBg: 'bg-teal-600' },
    { id: 'green', name: 'Green Growth', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', activeBg: 'bg-green-600' },
    { id: 'lime', name: 'Lime Zest', bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-100', activeBg: 'bg-lime-600' },
    { id: 'yellow', name: 'Yellow Sun', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', activeBg: 'bg-yellow-600' },
    { id: 'orange', name: 'Orange Sunset', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', activeBg: 'bg-orange-600' },
    { id: 'red', name: 'Red Passion', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', activeBg: 'bg-red-600' },
    { id: 'pink', name: 'Pink Love', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', activeBg: 'bg-pink-600' },
    { id: 'fuchsia', name: 'Fuchsia Flash', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100', activeBg: 'bg-fuchsia-600' },
    { id: 'purple', name: 'Purple Night', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', activeBg: 'bg-purple-600' },
    { id: 'slate', name: 'Slate Stone', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', activeBg: 'bg-slate-600' },
];

const iconMap = Icons as any;

type PendingStatusUpdate = {
    ids: number[];
    status: "PENDING" | "APPROVED" | "REJECTED" | "HOLD";
};

const ApprovalsManagementPage = () => {
    const dispatch = useAppDispatch();
    const [approvals, setApprovals] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [mainCategories, setMainCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [trucks, setTrucks] = useState<any[]>([]);
    const [trailers, setTrailers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reqLoading, setReqLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('manage');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [currentApproval, setCurrentApproval] = useState<any>(null);
    const [currentRequest, setCurrentRequest] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    // DataTable states
    const [filters, setFilters] = useState<any>({});
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [currentPdfData, setCurrentPdfData] = useState<string>("");
    const [currentPdfTitle, setCurrentPdfTitle] = useState<string>("");
    const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
    const [remarksInput, setRemarksInput] = useState("");
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        cardTitle: '',
        permissionColumn: '',
        routeSlug: '',
        approvalType: '',
        iconKey: 'LayoutDashboard',
        backgroundColor: 'indigo'
    });

    const emptyLineItem = () => ({
        productId: '',
        productName: '',
        specification: '',
        orderedQty: '1',
        unitPrice: '0',
        amount: '0',
        remarks: ''
    });

    const [requestData, setRequestData] = useState({
        approvalType: '',
        poRefNo: '',
        companyId: '',
        supplierId: '',
        remarks: '',
        totalAmount: '',
        requestedBy: 'admin',
        statusEntry: 'PENDING',
        purchaseType: 'LOCAL',
        currencyType: 'TZS',
        poStoreId: '',
        poDate: new Date().toISOString().split('T')[0],
        productLineItems: [emptyLineItem()],
        truckId: '',
        trailerId: ''
    });

    useEffect(() => {
        fetchData();
        fetchRequests();
        fetchMasters();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/approvals');
            const data = await response.json();
            setApprovals(data);
        } catch (error) {
            toast.error('Failed to load dashboard cards');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setReqLoading(true);
            const response = await fetch('/api/admin/approvals/request');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to load approval requests');
        } finally {
            setReqLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [compRes, supRes, storeRes, prodRes, mainCatRes, subCatRes, truckRes, trailerRes] = await Promise.all([
                fetch('/api/admin/masters?type=companies'),
                fetch('/api/admin/masters?type=suppliers'),
                fetch('/api/admin/masters?type=stores'),
                fetch('/api/admin/products'),
                fetch('/api/admin/categories?type=main'),
                fetch('/api/admin/categories?type=sub'),
                fetch('/api/admin/trucks'),
                fetch('/api/admin/trailers')
            ]);
            const compData = await compRes.json();
            const supData = await supRes.json();
            const storeData = await storeRes.json();
            const prodData = await prodRes.json();
            const mainCatData = await mainCatRes.json();
            const subCatData = await subCatRes.json();
            const truckData = await truckRes.json();
            const trailerData = await trailerRes.json();
            setCompanies(Array.isArray(compData) ? compData : []);
            setSuppliers(Array.isArray(supData) ? supData : []);
            setStores(Array.isArray(storeData) ? storeData : []);
            setProducts(Array.isArray(prodData) ? prodData : []);
            setMainCategories(Array.isArray(mainCatData) ? mainCatData : []);
            setSubCategories(Array.isArray(subCatData) ? subCatData : []);
            setTrucks(Array.isArray(truckData) ? truckData : []);
            setTrailers(Array.isArray(trailerData) ? trailerData : []);
        } catch (error) {
            console.error('Master fetching failed');
            setCompanies([]); setSuppliers([]); setStores([]);
            setProducts([]); setMainCategories([]); setSubCategories([]);
            setTrucks([]); setTrailers([]);
        }
    };

    // --- Approval Card handlers ---
    const handleOpenModal = (approval: any = null) => {
        if (approval) {
            setCurrentApproval(approval);
            setFormData({
                cardTitle: approval.cardTitle,
                permissionColumn: approval.permissionColumn,
                routeSlug: approval.routeSlug,
                approvalType: approval.approvalType,
                iconKey: approval.iconKey || 'LayoutDashboard',
                backgroundColor: approval.backgroundColor || 'indigo'
            });
        } else {
            setCurrentApproval(null);
            setFormData({ cardTitle: '', permissionColumn: '', routeSlug: '', approvalType: '', iconKey: 'LayoutDashboard', backgroundColor: 'indigo' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsRequestModalOpen(false);
        setSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentApproval ? `/api/admin/approvals/${currentApproval.sno}` : '/api/admin/approvals';
            const method = currentApproval ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, sno: currentApproval?.sno })
            });
            if (response.ok) {
                toast.success(currentApproval ? 'Approval updated' : 'Approval created');
                fetchData();
                dispatch(fetchDashboardCards());
                handleCloseModal();
            } else {
                toast.error('Action failed');
            }
        } catch (error) {
            toast.error('Server error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteApproval = async (id: number) => {
        if (!confirm('Are you sure you want to remove this approval type?')) return;
        try {
            const response = await fetch(`/api/admin/approvals/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Approval removed');
                fetchData();
                dispatch(fetchDashboardCards());
            } else {
                toast.error('Failed to remove');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    // --- Approval Request handlers ---
    const handleOpenRequestModal = (request: any = null) => {
        if (request) {
            setCurrentRequest(request);
            setRequestData({
                approvalType: request.approvalType,
                poRefNo: request.poRefNo,
                companyId: request.companyId?.toString() || '',
                supplierId: request.supplierId?.toString() || '',
                remarks: request.remarks || '',
                totalAmount: request.totalFinalProductionHdrAmount?.toString() || '',
                requestedBy: request.requestedBy || 'admin',
                statusEntry: request.statusEntry || 'PENDING',
                purchaseType: request.purchaseType || 'LOCAL',
                currencyType: request.currencyType || 'TZS',
                poStoreId: request.poStoreId?.toString() || '',
                poDate: request.poDate ? new Date(request.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                productLineItems: request.productLineItems?.length > 0
                    ? request.productLineItems.map((li: any) => ({
                        productId: li.productId?.toString() || '',
                        productName: li.productName || '',
                        specification: li.specification || '',
                        orderedQty: li.orderedQty?.toString() || '1',
                        unitPrice: li.unitPrice?.toString() || '0',
                        amount: li.amount?.toString() || '0',
                        remarks: li.remarks || ''
                    }))
                    : [emptyLineItem()],
                truckId: request.truckId?.toString() || '',
                trailerId: request.trailerId?.toString() || ''
            });
        } else {
            setCurrentRequest(null);
            setRequestData({
                approvalType: '', poRefNo: '', companyId: '', supplierId: '', remarks: '',
                totalAmount: '', requestedBy: 'admin', statusEntry: 'PENDING',
                purchaseType: 'LOCAL', currencyType: 'TZS', poStoreId: '',
                poDate: new Date().toISOString().split('T')[0],
                productLineItems: [emptyLineItem()],
                truckId: '',
                trailerId: ''
            });
        }
        setIsRequestModalOpen(true);
    };

    const handleRequestApproval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestData.approvalType) return toast.error('Select approval type');
        setSaving(true);
        try {
            const url = currentRequest ? `/api/admin/approvals/request/${currentRequest.sno}` : '/api/admin/approvals/request';
            const method = currentRequest ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            if (response.ok) {
                toast.success(currentRequest ? 'Request updated' : 'Approval request sent successfully');
                fetchRequests();
                handleCloseModal();
            } else {
                const err = await response.json().catch(() => ({}));
                toast.error(err.message || 'Action failed');
            }
        } catch (error) {
            toast.error('Server error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRequest = async (id: number) => {
        if (!confirm('Are you sure you want to delete this specific request?')) return;
        try {
            const response = await fetch(`/api/admin/approvals/request/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Request deleted');
                fetchRequests();
            } else {
                toast.error('Deletion failed');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    // --- Status update ---
    const confirmStatusChange = async () => {
        if (!pendingStatusUpdate || !remarksInput.trim()) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/approvals/request`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: pendingStatusUpdate.ids,
                    status: pendingStatusUpdate.status,
                    remarks: remarksInput
                })
            });
            if (response.ok) {
                toast.success(`${pendingStatusUpdate.ids.length} request(s) marked as ${pendingStatusUpdate.status}`);
                fetchRequests();
                setSelectedRows([]);
                setPendingStatusUpdate(null);
                setRemarksInput("");
                setIsRemarksModalOpen(false);
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            toast.error('Network error during status update');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Helper fns for master name resolution ---
    const getCompanyName = (id: any) => {
        if (id == null) return null;
        const c = companies.find(c => c.companyId === Number(id));
        return c?.companyName || id;
    };

    const getSupplierName = (id: any) => {
        if (id == null) return null;
        const s = suppliers.find(s => s.supplierId === Number(id));
        return s?.supplierName || id;
    };

    const getStoreName = (id: any) => {
        if (id == null) return null;
        const s = stores.find(s => s.storeId === Number(id));
        return s?.storeName || id;
    };

    const getProductName = (id: any) => {
        const p = products.find(p => p.productId === Number(id));
        return p;
    };

    const getMainCategoryName = (id: any) => {
        const c = mainCategories.find(c => c.mainCategoryId === Number(id));
        return c?.categoryName || id;
    };

    const getSubCategoryName = (id: any) => {
        const c = subCategories.find(c => c.subCategoryId === Number(id));
        return c?.subCategoryName || id;
    };

    const getTruckNumber = (id: any) => {
        const t = trucks.find(t => t.truckId === Number(id));
        return t?.truckNumber || id;
    };

    const getTrailerNumber = (id: any) => {
        const t = trailers.find(t => t.trailerId === Number(id));
        return t?.trailerNumber || id;
    };

    // --- Product line item helpers ---
    const handleLineItemChange = (index: number, field: string, value: string) => {
        const items = [...requestData.productLineItems];
        items[index] = { ...items[index], [field]: value };

        // Auto-calc amount when product, qty or price changes
        if (field === 'productId') {
            const product = getProductName(value);
            if (product) {
                items[index].productName = product.productName || '';
                items[index].specification = product.specification || '';
            }
        }
        if (field === 'orderedQty' || field === 'unitPrice') {
            const qty = parseFloat(items[index].orderedQty) || 0;
            const price = parseFloat(items[index].unitPrice) || 0;
            items[index].amount = (qty * price).toFixed(2);
        }
        // Update total amount sum
        const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        setRequestData({ ...requestData, productLineItems: items, totalAmount: total.toFixed(2) });
    };

    const addLineItem = () => {
        setRequestData({
            ...requestData,
            productLineItems: [...requestData.productLineItems, emptyLineItem()]
        });
    };

    const removeLineItem = (index: number) => {
        if (requestData.productLineItems.length <= 1) return;
        const items = requestData.productLineItems.filter((_, i) => i !== index);
        const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        setRequestData({ ...requestData, productLineItems: items, totalAmount: total.toFixed(2) });
    };

    // --- Table columns ---
    const onViewDocument = (row: any) => {
        toast.error(`Document viewer requires purchased order files — coming soon for admin panel`);
    };

    const onGenerateInvoicePdf = async (row: any) => {
        try {
            const [{ jsPDF }, autoTableModule] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable")
            ]);
            const autoTable = autoTableModule.default;
            const doc = new (jsPDF as any)({ unit: "mm", format: "a4" });
            const margin = 14;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("APPROVAL REQUEST", margin, 14);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Ref: ${row.poRefNo || "-"}`, margin, 21);
            doc.text(`Date: ${row.poDate ? new Date(row.poDate).toLocaleDateString() : "-"}`, margin, 26);
            doc.text(`Type: ${row.approvalType || "-"}`, margin, 31);
            doc.text(`Requested By: ${row.requestedBy || "-"}`, margin, 36);
            doc.text(`Total: ${row.currencyType || ""} ${Number(row.totalFinalProductionHdrAmount || 0).toLocaleString()}`, margin, 41);

            autoTable(doc, {
                startY: 48,
                head: [["Field", "Value"]],
                body: [
                    ["Approval Type", row.approvalType || "-"],
                    ["PO Ref No", row.poRefNo || "-"],
                    ["Company", getCompanyName(row.companyId) || "-"],
                    ["Supplier", getSupplierName(row.supplierId) || "-"],
                    ["Department", getStoreName(row.poStoreId) || "-"],
                    ["Purchase Type", row.purchaseType || "-"],
                    ["Currency", row.currencyType || "-"],
                    ["Amount", `${row.currencyType || ""} ${Number(row.totalFinalProductionHdrAmount || 0).toLocaleString()}`],
                    ["Status", row.finalResponseStatus || row.statusEntry || "PENDING"],
                    ["Remarks", row.remarks || "-"]
                ],
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [79, 70, 229] },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 120 } }
            });

            const pdfOutput = doc.output('datauristring');
            setCurrentPdfData(pdfOutput);
            setCurrentPdfTitle(`Approval - ${row.poRefNo || "Document"}`);
            setIsPdfModalOpen(true);
            toast.success(`PDF generated for ${row.poRefNo}`);
        } catch {
            toast.error(`Failed to generate PDF`);
        }
    };

    const onViewConversation = (row: any) => {
        window.open(`/${row.approvalType}/conversation?poRefNo=${row.poRefNo}`, '_blank');
    };

    const tableColumns: Column[] = [
        {
            key: 'action',
            label: 'Action',
            headerAlign: 'center',
            width: '180px',
            render: (_: any, row: any, { isExpanded, toggleExpansion }: any) => (
                <div className="flex items-center justify-center space-x-1.5 min-w-[160px]">
                    <button
                        onClick={() => handleOpenRequestModal(row)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shrink-0"
                        title="Edit"
                    >
                        <Icons.Edit2 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDocument(row); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200 shrink-0"
                        title="View Document"
                    >
                        <FileText size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onGenerateInvoicePdf(row); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200 shrink-0"
                        title="Generate PDF"
                    >
                        <Image src="/pdf_icon.png" alt="PDF" width={14} height={14} className="block w-3.5 h-3.5 object-contain" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewConversation(row); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100 shrink-0"
                        title="Conversation"
                    >
                        <MessageSquareMore size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest(row.sno); }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shrink-0"
                        title="Delete"
                    >
                        <Icons.Trash2 size={14} />
                    </button>
                    <button
                        onClick={toggleExpansion}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all border shrink-0 ${isExpanded
                            ? 'bg-indigo-600 text-white border-indigo-600 rotate-180'
                            : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                        }`}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        <ChevronDown size={12} strokeWidth={3} />
                    </button>
                </div>
            )
        },
        { key: 'sno', label: 'SNO', render: (val: number) => <span className="font-bold text-slate-800">{val}</span> },
        {
            key: 'companyId',
            label: 'Company',
            render: (id: any) => <span className="text-slate-500 font-semibold">{getCompanyName(id) || id}</span>
        },
        { key: 'poRefNo', label: 'REF NO', render: (value: string) => <span className="text-[13px] font-bold text-slate-700">{value}</span> },
        {
            key: 'approvalType', label: 'Type', render: (value: string) => (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-indigo-100 text-indigo-700 uppercase">
                    {value}
                </span>
            )
        },
        {
            key: 'purchaseType', label: 'PO Type', render: (value: string) => (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-100 text-emerald-700 uppercase">
                    {value || 'LOCAL'}
                </span>
            )
        },
        {
            key: 'supplierId',
            label: 'Supplier',
            render: (value: any) => (
                <span className="text-[12px] font-bold text-slate-700 leading-tight uppercase max-w-[150px] block truncate" title={getSupplierName(value)}>
                    {getSupplierName(value) || value}
                </span>
            )
        },
        {
            key: 'poStoreId',
            label: 'Dept',
            responsiveClass: 'hidden md:table-cell',
            render: (id: any) => <span className="text-slate-600 font-medium">{getStoreName(id) || id}</span>
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (value: number, row: any) => (
                <span className="font-black text-slate-900 text-[14px]">
                    {Number(row.totalFinalProductionHdrAmount || 0).toLocaleString()} {row.currencyType}
                </span>
            )
        },
        {
            key: 'requestedBy',
            label: 'Requested By',
            render: (_: any, row: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-700 text-[11px] font-bold">{row.requestedBy}</span>
                    <span className="text-slate-400 text-[10px]">
                        {row.createdDate ? new Date(row.createdDate).toLocaleDateString() : ''}
                    </span>
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
                        <div className="w-7 h-7 bg-amber-100 text-amber-700 flex items-center justify-center rounded font-bold">
                            {diffDays}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'finalResponseStatus',
            label: 'Status',
            render: (val: string, row: any) => {
                const status = val || row?.statusEntry || 'PENDING';
                const colors: Record<string, string> = {
                    'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
                    'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
                    'HOLD': 'bg-indigo-100 text-indigo-700 border-indigo-200',
                };
                return (
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border shadow-sm ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {status}
                    </span>
                );
            }
        }
    ];

    // Filtered data for DataTable
    const filteredData = useMemo(() => {
        const rawData = requests || [];
        const data = rawData.map((item: any) => {
            const created = new Date(item.createdDate || new Date());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                ...item,
                id: item.sno,
                pendingDays: diffDays,
                amount: item.totalFinalProductionHdrAmount,
                finalResponseStatus: item.finalResponseStatus || item.statusEntry || 'PENDING'
            };
        });

        if (Object.keys(filters).length === 0) return data;

        return data.filter((item: any) => {
            if (filters.company && item.companyId?.toString() !== filters.company.toString()) return false;
            if (filters.purchaseType && filters.purchaseType !== 'all' && item.purchaseType?.toLowerCase() !== filters.purchaseType.toLowerCase()) return false;
            if (filters.supplier && filters.supplier !== 'all') {
                if (item.supplierId?.toString() !== filters.supplier.toString()) return false;
            }
            if (filters.department && filters.department !== 'all') {
                if (item.poStoreId?.toString() !== filters.department.toString()) return false;
            }
            if (filters.status && filters.status !== 'all') {
                const itemStatus = (item.finalResponseStatus || 'PENDING').toLowerCase();
                if (itemStatus !== filters.status.toLowerCase()) return false;
            }
            if (filters.poRollNo && !item.poRefNo.toLowerCase().includes(filters.poRollNo.toLowerCase())) return false;
            if (filters.currency && item.currencyType !== filters.currency) return false;
            if (filters.minAmount || filters.maxAmount) {
                const numericAmount = item.amount;
                if (filters.minAmount && numericAmount < parseFloat(filters.minAmount)) return false;
                if (filters.maxAmount && numericAmount > parseFloat(filters.maxAmount)) return false;
            }
            if (filters.searchFrom || filters.searchTo) {
                const itemDate = new Date(item.createdDate || item.poDate || new Date());
                itemDate.setHours(0, 0, 0, 0);
                if (filters.searchFrom) {
                    const fromDate = new Date(filters.searchFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (itemDate < fromDate) return false;
                }
                if (filters.searchTo) {
                    const toDate = new Date(filters.searchTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (itemDate > toDate) return false;
                }
            }
            return true;
        });
    }, [filters, requests]);

    const handleApplyFilters = (newFilters: any) => {
        setIsLoading(true);
        setFilters(newFilters);
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleResetFilters = () => {
        setFilters({});
        toast('Filters cleared', { icon: '🧹' });
    };

    // Build filter options from master data
    const filterOptions = useMemo(() => ({
        companies: companies.map(c => ({ id: c.companyId, name: c.companyName })),
        purchaseTypes: Array.from(new Set(requests.map((i: any) => i.purchaseType).filter(Boolean))).map(String),
        suppliers: suppliers.map(s => ({ id: s.supplierId, name: s.supplierName })),
        departments: stores.map(s => ({ id: s.storeId, name: s.storeName }))
    }), [companies, suppliers, stores, requests]);

    return (
        <div className="space-y-6">
            <PdfViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                pdfData={currentPdfData}
                title={currentPdfTitle}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Approval Configuration</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage approval types and create new requests</p>
                </div>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'manage'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Manage Approval Cards
                </button>
                <button
                    onClick={() => setActiveTab('request')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'request'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Manage Approval Requests
                </button>
            </div>

            {activeTab === 'manage' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-full min-h-[220px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 transition-all group-hover:scale-110">
                            <Icons.Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">Add New Card</span>
                        <p className="text-[10px] opacity-70 mt-2 text-center max-w-[150px]">Define a new approval module for users</p>
                    </button>

                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-full min-h-[220px] bg-white border border-slate-100 rounded-3xl animate-pulse" />
                        ))
                    ) : approvals.map(app => {
                        const Icon = iconMap[app.iconKey] || Icons.LayoutDashboard;
                        const theme = THEME_MAP.find(t => t.id === app.backgroundColor) || THEME_MAP[0];
                        const bgColor = `${theme.bg} ${theme.text} ${theme.border}`;

                        return (
                            <div key={app.sno} className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 p-6 transition-all hover:-translate-y-1">
                                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center border ${bgColor}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{app.cardTitle}</h3>
                                <p className="text-xs text-slate-400 font-medium mb-4">{app.permissionColumn}</p>
                                <div className="flex items-center space-x-2 pt-4 border-t border-slate-50">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-300">Route: /{app.routeSlug}</span>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <button
                                        onClick={() => handleOpenModal(app)}
                                        className="p-2 bg-white rounded-xl shadow-md text-slate-400 hover:text-indigo-600 border border-slate-50 transition-colors"
                                    >
                                        <Icons.Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteApproval(app.sno)}
                                        className="p-2 bg-white rounded-xl shadow-md text-slate-400 hover:text-red-500 border border-slate-50 transition-colors"
                                    >
                                        <Icons.Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="flex justify-end">
                        <button
                            onClick={() => handleOpenRequestModal()}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center space-x-2 hover:bg-indigo-700"
                        >
                            <Icons.Plus size={20} />
                            <span>Create New Request</span>
                        </button>
                    </div>

                    {reqLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600" size={40} />
                        </div>
                    ) : (
                        <>
                            <FilterForm
                                filters={filters}
                                onFilterChange={setFilters}
                                onApplyFilters={handleApplyFilters}
                                onReset={handleResetFilters}
                                isLoading={isLoading}
                                title="Filter All Approval Requests"
                                filterOptions={filterOptions}
                            />

                            <DataTable
                                title="All Approval Requests"
                                subTitle="Master List"
                                data={filteredData}
                                totalRows={filteredData.length}
                                columns={tableColumns}
                                isLoading={isLoading || reqLoading}
                                showSearch={true}
                                onSearch={() => {}}
                                exportOptions={{
                                    enabled: true,
                                    formats: ['csv', 'excel', 'pdf'],
                                    onExport: (format) => {
                                        const dataToExport = selectedRows.length > 0
                                            ? filteredData.filter((item: any) => selectedRows.includes(item.id))
                                            : filteredData;

                                        if (format === 'csv' || format === 'excel') {
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
                                            link.setAttribute("download", `ApprovalRequests_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
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
                                                doc.setFontSize(18);
                                                doc.setTextColor(40, 40, 40);
                                                doc.text("Approval Requests Report", 14, 20);
                                                doc.setFontSize(10);
                                                doc.setTextColor(100, 100, 100);
                                                doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
                                                doc.text(`Total Records: ${dataToExport.length}`, 14, 33);

                                                const exportableColumns = tableColumns.filter(c => c.key !== 'action');
                                                const tableHead = exportableColumns.map(c => c.label);
                                                const tableBody = dataToExport.map((row: any) =>
                                                    exportableColumns.map(c => {
                                                        const val = row[c.key as keyof typeof row];
                                                        if (val === null || val === undefined) return '';
                                                        return String(val);
                                                    })
                                                );

                                                autoTable(doc, {
                                                    head: [tableHead],
                                                    body: tableBody,
                                                    startY: 40,
                                                    theme: 'grid',
                                                    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
                                                    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                                                    didDrawPage: (data: any) => {
                                                        const str = 'Page ' + doc.internal.getNumberOfPages();
                                                        doc.setFontSize(8);
                                                        const pageSize = doc.internal.pageSize;
                                                        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                        doc.text(str, data.settings.margin.left, pageHeight - 10);
                                                    }
                                                });
                                                doc.save(`ApprovalRequests_${new Date().toISOString().split('T')[0]}.pdf`);
                                                toast.success("PDF Downloaded successfully");
                                            }).catch(() => toast.error("Failed to generate PDF"));
                                        }
                                    }
                                }}
                                selection={{
                                    enabled: true,
                                    selectedRows,
                                    onSelectedRowsChange: setSelectedRows
                                }}
                                expansion={{
                                    enabled: true,
                                    expandedRows,
                                    hideExpansionColumn: true,
                                    onExpandedRowsChange: setExpandedRows,
                                    renderExpansion: (row: any) => (
                                        <div className="flex flex-col space-y-6 px-4 py-6 bg-slate-50/30 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-500">
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-x-12 gap-y-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization Unit</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                                                        <span className="text-[14px] font-bold text-slate-800">
                                                            {getCompanyName(row.companyId) || row.companyId}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-100 pl-8">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency Axis</span>
                                                    <p className="text-[14px] font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                                                        <span className="text-slate-400 font-medium">{row.currencyType || 'TZS'}</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">BASE</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-100 pl-8">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Dept</span>
                                                    <p className="text-[14px] font-bold text-slate-800">
                                                        {getStoreName(row.poStoreId) || row.poStoreId}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-100 pl-8">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Record</span>
                                                    <p className="text-[14px] font-bold text-slate-800 flex items-center space-x-1.5">
                                                        <span className="text-indigo-600">#{row.sno?.toString().padStart(4, '0')}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                        <span className="text-slate-500">{row.poRefNo}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">01</div>
                                                            <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Technical Review</span>
                                                        </div>
                                                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response1Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
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

                                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">02</div>
                                                            <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Executive Decision</span>
                                                        </div>
                                                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${row.response2Status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
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
                                toolbarActions={(
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); }}
                                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all shadow-sm active:rotate-180 duration-500"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 shadow-sm">
                                            <Settings size={16} />
                                        </button>
                                    </div>
                                )}
                                bulkActions={(ids: number[]) => (
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm">
                                            <select
                                                className="bg-transparent text-xs font-bold text-slate-700 py-1 pl-3 pr-8 outline-none border-none focus:ring-0 cursor-pointer"
                                                defaultValue=""
                                                onChange={(e) => {
                                                    const status = e.target.value;
                                                    if (!status || ids.length === 0) return;
                                                    setPendingStatusUpdate({ ids: [...ids], status: status as PendingStatusUpdate["status"] });
                                                    setRemarksInput("");
                                                    setIsRemarksModalOpen(true);
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
                        </>
                    )}
                </div>
            )}

            {/* ============ MODAL: Manage Cards ============ */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden flex flex-col max-h-[92vh]">
                            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 bg-linear-to-r from-slate-50/50 to-white shrink-0">
                                    <h2 className="text-2xl font-bold text-slate-800">{currentApproval ? 'Edit' : 'Create'} Dashboard Card</h2>
                                    <p className="text-sm text-slate-400 mt-1">Configure appearance and permissions</p>
                                </div>
                                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Card Title</label>
                                        <input required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Purchase Order Approval" value={formData.cardTitle} onChange={e => setFormData({ ...formData, cardTitle: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Permission Code</label>
                                            <input required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="poApproval" value={formData.permissionColumn} onChange={e => setFormData({ ...formData, permissionColumn: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Route Slug</label>
                                            <input required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="purchase-order" value={formData.routeSlug} onChange={e => setFormData({ ...formData, routeSlug: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Internal Type</label>
                                        <input required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="purchase-order" value={formData.approvalType} onChange={e => setFormData({ ...formData, approvalType: e.target.value })} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Icon & Vibrant Theme Selection</label>
                                            <div className="relative w-48">
                                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input type="text" placeholder="Search icons..." className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500" value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl custom-scrollbar border border-slate-100">
                                            {AVAILABLE_ICONS.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).map(iconName => {
                                                const PickerIcon = iconMap[iconName] || Icons.HelpCircle;
                                                const isSelected = formData.iconKey === iconName;
                                                return (
                                                    <button key={iconName} type="button" onClick={() => setFormData({ ...formData, iconKey: iconName })} title={iconName}
                                                        className={`aspect-square rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110' : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                                        <PickerIcon size={18} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {THEME_MAP.map(theme => (
                                                <button key={theme.id} type="button" onClick={() => setFormData({ ...formData, backgroundColor: theme.id })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.backgroundColor === theme.id ? 'border-slate-800 scale-110 ring-2 ring-slate-100' : 'border-transparent'} ${theme.activeBg}`} title={theme.name} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 flex gap-3 shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Dismiss</button>
                                    <button type="submit" disabled={saving} className="flex-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2">
                                        {saving ? <Icons.Loader2 className="animate-spin" size={20} /> : <Icons.Check size={20} />}
                                        <span>{currentApproval ? 'Update Details' : 'Initialize Card'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============ MODAL: Manage Requests ============ */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
                            <form onSubmit={handleRequestApproval} className="flex flex-col h-full min-h-0 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 bg-linear-to-r from-indigo-50/50 to-white shrink-0">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            {currentRequest ? <Icons.Edit2 size={24} /> : <Icons.Send size={24} />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">{currentRequest ? 'Update' : 'Dispatch'} Approval Request</h2>
                                            <p className="text-sm text-slate-500">Configure the pending item for reviewers</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5 col-span-1">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Approval Category</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.approvalType} onChange={e => setRequestData({ ...requestData, approvalType: e.target.value })}>
                                                <option value="">Select Category</option>
                                                {Array.isArray(approvals) && approvals.map(app => (
                                                    <option key={app.sno} value={app.approvalType}>{app.cardTitle}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Reference Number</label>
                                            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                placeholder="e.g. PO/2025/001" value={requestData.poRefNo} onChange={e => setRequestData({ ...requestData, poRefNo: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Purchase Type</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.purchaseType} onChange={e => setRequestData({ ...requestData, purchaseType: e.target.value })}>
                                                <option value="LOCAL">Local Purchase</option>
                                                <option value="IMPORT">Import / International</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">PO Date</label>
                                            <input type="date" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                value={requestData.poDate} onChange={e => setRequestData({ ...requestData, poDate: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Company</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.companyId} onChange={e => setRequestData({ ...requestData, companyId: e.target.value })}>
                                                <option value="">Select Company</option>
                                                {Array.isArray(companies) && companies.map(c => (
                                                    <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Supplier</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.supplierId} onChange={e => setRequestData({ ...requestData, supplierId: e.target.value })}>
                                                <option value="">Select Supplier</option>
                                                {Array.isArray(suppliers) && suppliers.map(s => (
                                                    <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Department / Store</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.poStoreId} onChange={e => setRequestData({ ...requestData, poStoreId: e.target.value })}>
                                                <option value="">Select Department</option>
                                                {Array.isArray(stores) && stores.map(s => (
                                                    <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Currency</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.currencyType} onChange={e => setRequestData({ ...requestData, currencyType: e.target.value })}>
                                                <option value="TZS">TZS - Tanzanian Shilling</option>
                                                <option value="USD">USD - US Dollar</option>
                                                <option value="AED">AED - UAE Dirham</option>
                                                <option value="EUR">EUR - Euro</option>
                                                <option value="GBP">GBP - British Pound</option>
                                                <option value="INR">INR - Indian Rupee</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Truck</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.truckId} onChange={e => setRequestData({ ...requestData, truckId: e.target.value })}>
                                                <option value="">Select Truck</option>
                                                {Array.isArray(trucks) && trucks.map(t => (
                                                    <option key={t.truckId} value={t.truckId}>{t.truckNumber}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Trailer</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.trailerId} onChange={e => setRequestData({ ...requestData, trailerId: e.target.value })}>
                                                <option value="">Select Trailer</option>
                                                {Array.isArray(trailers) && trailers.map(t => (
                                                    <option key={t.trailerId} value={t.trailerId}>{t.trailerNumber}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Product Line Items */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Product Line Items</label>
                                            <button type="button" onClick={addLineItem}
                                                className="px-3 py-1.5 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center space-x-1">
                                                <Icons.Plus size={12} />
                                                <span>Add Item</span>
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                            {requestData.productLineItems.map((item, index) => (
                                                <div key={index} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-slate-400">Item #{index + 1}</span>
                                                        {requestData.productLineItems.length > 1 && (
                                                            <button type="button" onClick={() => removeLineItem(index)}
                                                                className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                                                                <Icons.X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                                        <div className="sm:col-span-2 space-y-0.5">
                                                            <label className="text-[8px] font-black uppercase text-slate-400">Product</label>
                                                            <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                                value={item.productId} onChange={e => handleLineItemChange(index, 'productId', e.target.value)}>
                                                                <option value="">Select Product</option>
                                                                {Array.isArray(products) && products.map(p => (
                                                                    <option key={p.productId} value={p.productId}>
                                                                        {p.productName} ({getMainCategoryName(p.mainCategoryId)} / {getSubCategoryName(p.subCategoryId)})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <label className="text-[8px] font-black uppercase text-slate-400">Qty</label>
                                                            <input type="number" step="0.0001" min="0"
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                                                                value={item.orderedQty} onChange={e => handleLineItemChange(index, 'orderedQty', e.target.value)} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <label className="text-[8px] font-black uppercase text-slate-400">Unit Price</label>
                                                            <input type="number" step="0.000001" min="0"
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                                                                value={item.unitPrice} onChange={e => handleLineItemChange(index, 'unitPrice', e.target.value)} />
                                                        </div>
                                                    </div>
                                                    {item.productName && (
                                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                                            <span className="font-bold truncate max-w-[200px]">{item.productName}</span>
                                                            {item.specification && <span className="text-slate-300">|</span>}
                                                            {item.specification && <span className="truncate max-w-[200px]">{item.specification}</span>}
                                                            <span className="ml-auto font-black text-slate-700">{requestData.currencyType === 'USD' ? '$' : requestData.currencyType} {parseFloat(item.amount || '0').toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Total Amount</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                                                    {requestData.currencyType === 'USD' ? '$' : requestData.currencyType}
                                                </div>
                                                <input type="number" readOnly
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-800"
                                                    placeholder="0.00" value={requestData.totalAmount} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Current Status</label>
                                            <select required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.statusEntry} onChange={e => setRequestData({ ...requestData, statusEntry: e.target.value })}>
                                                <option value="PENDING">Pending Review</option>
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Requested By</label>
                                            <div className="relative">
                                                <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input type="text" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                    value={requestData.requestedBy} onChange={e => setRequestData({ ...requestData, requestedBy: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Remarks / Justification</label>
                                        <textarea className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold min-h-[100px]"
                                            placeholder="Enter detailed justification for this approval request..."
                                            value={requestData.remarks} onChange={e => setRequestData({ ...requestData, remarks: e.target.value })} />
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 flex gap-3 shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Dismiss</button>
                                    <button type="submit" disabled={saving} className="flex-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2">
                                        {saving ? <Icons.Loader2 className="animate-spin" size={20} /> : <Icons.Check size={20} />}
                                        <span>{currentRequest ? 'Save Changes' : 'Submit Request'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============ MODAL: Status Confirmation ============ */}
            {isRemarksModalOpen && (
                <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-800">Status Confirmation</h3>
                            <button onClick={() => setIsRemarksModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500 font-medium">
                                You are about to mark <span className="text-indigo-600 font-bold">{pendingStatusUpdate?.ids?.length} request(s)</span> as{' '}
                                <span className={`font-bold ${pendingStatusUpdate?.status === 'APPROVED' ? 'text-emerald-600' : pendingStatusUpdate?.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>
                                    {pendingStatusUpdate?.status}
                                </span>.
                            </p>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Remarks / Comments <span className="text-rose-500">*</span></label>
                                <textarea value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)}
                                    placeholder="Enter mandatory remarks for this action..."
                                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 text-slate-700" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button onClick={() => setIsRemarksModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                            <button onClick={confirmStatusChange} disabled={!remarksInput.trim()}
                                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center space-x-2">
                                <span>Confirm Update</span>
                                {isLoading && <RefreshCw size={14} className="animate-spin" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalsManagementPage;
