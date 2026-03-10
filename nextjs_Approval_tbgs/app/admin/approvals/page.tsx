"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '@/redux/hooks';
import { fetchDashboardCards } from '@/redux/slices/dashboardSlice';

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

const ApprovalsManagementPage = () => {
    const dispatch = useAppDispatch();
    const [approvals, setApprovals] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reqLoading, setReqLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'request'
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [currentApproval, setCurrentApproval] = useState<any>(null);
    const [currentRequest, setCurrentRequest] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    // Approval Card Form state
    const [formData, setFormData] = useState({
        cardTitle: '',
        permissionColumn: '',
        routeSlug: '',
        approvalType: '',
        iconKey: 'LayoutDashboard',
        backgroundColor: 'indigo'
    });

    // Request Approval Form state
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
        currencyType: 'USD',
        poStoreId: '',
        poDate: new Date().toISOString().split('T')[0]
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
            const [compRes, supRes, storeRes] = await Promise.all([
                fetch('/api/admin/masters?type=companies'),
                fetch('/api/admin/masters?type=suppliers'),
                fetch('/api/admin/masters?type=stores')
            ]);
            
            const compData = await compRes.json();
            const supData = await supRes.json();
            const storeData = await storeRes.json();

            setCompanies(Array.isArray(compData) ? compData : []);
            setSuppliers(Array.isArray(supData) ? supData : []);
            setStores(Array.isArray(storeData) ? storeData : []);
        } catch (error) {
            console.error('Master fetching failed');
            setCompanies([]);
            setSuppliers([]);
            setStores([]);
        }
    };

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
            setFormData({
                cardTitle: '',
                permissionColumn: '',
                routeSlug: '',
                approvalType: '',
                iconKey: 'LayoutDashboard',
                backgroundColor: 'indigo'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsRequestModalOpen(false);
        setSaving(false);
    };

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
                currencyType: request.currencyType || 'USD',
                poStoreId: request.poStoreId?.toString() || '',
                poDate: request.poDate ? new Date(request.poDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            setCurrentRequest(null);
            setRequestData({
                approvalType: '',
                poRefNo: '',
                companyId: '',
                supplierId: '',
                remarks: '',
                totalAmount: '',
                requestedBy: 'admin',
                statusEntry: 'PENDING',
                purchaseType: 'LOCAL',
                currencyType: 'USD',
                poStoreId: '',
                poDate: new Date().toISOString().split('T')[0]
            });
        }
        setIsRequestModalOpen(true);
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
                body: JSON.stringify({
                    ...formData,
                    sno: currentApproval?.sno
                })
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
                toast.error('Action failed');
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

    // Pagination Logic
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'All') {
            setItemsPerPage(requests.length > 0 ? requests.length : 10);
        } else {
            setItemsPerPage(Number(val));
        }
        setCurrentPage(1); // Reset to first page
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(requests.length / itemsPerPage);

    return (
        <div className="space-y-6">
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

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Reference #</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Type</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Amount</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reqLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-4 h-16 bg-slate-50/20" />
                                        </tr>
                                    ))
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No approval requests found</td>
                                    </tr>
                                ) : currentRequests.map((req) => (
                                    <tr key={req.sno} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{req.poRefNo}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{req.requestedBy || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">
                                                {req.approvalType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {req.createdDate ? new Date(req.createdDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-800">
                                            ${Number(req.totalFinalProductionHdrAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                req.statusEntry === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                req.statusEntry === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {req.statusEntry || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleOpenRequestModal(req)}
                                                    className="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"
                                                >
                                                    <Icons.Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRequest(req.sno)}
                                                    className="p-2 hover:bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <Icons.Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {!reqLoading && requests.length > 0 && (
                        <div className="flex items-center justify-between mt-4 px-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-500">Show</span>
                                <select 
                                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 outline-none font-bold"
                                    value={itemsPerPage === requests.length && requests.length !== 10 && requests.length !== 5 && requests.length !== 25 && requests.length !== 50 ? 'All' : itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="All">All</option>
                                </select>
                                <span className="text-sm font-medium text-slate-500">entries</span>
                            </div>

                            <div className="flex items-center justify-center space-x-4">
                                <span className="text-sm text-slate-500 font-medium">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, requests.length)} of {requests.length}
                                </span>
                                <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <button 
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 border-r border-slate-200 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 text-sm font-bold transition-colors border-x border-slate-200/50 ${
                                                currentPage === page
                                                ? 'text-indigo-600 bg-indigo-50/50'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button 
                                        type="button"
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 border-l border-slate-200 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Manage Cards */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden flex flex-col max-h-[92vh]"
                        >
                            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 bg-linear-to-r from-slate-50/50 to-white shrink-0">
                                    <h2 className="text-2xl font-bold text-slate-800">{currentApproval ? 'Edit' : 'Create'} Dashboard Card</h2>
                                    <p className="text-sm text-slate-400 mt-1">Configure appearance and permissions</p>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Card Title</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                            placeholder="Purchase Order Approval"
                                            value={formData.cardTitle}
                                            onChange={e => setFormData({ ...formData, cardTitle: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Permission Code</label>
                                            <input
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="poApproval"
                                                value={formData.permissionColumn}
                                                onChange={e => setFormData({ ...formData, permissionColumn: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Route Slug</label>
                                            <input
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="purchase-order"
                                                value={formData.routeSlug}
                                                onChange={e => setFormData({ ...formData, routeSlug: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Internal Type</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                            placeholder="purchase-order"
                                            value={formData.approvalType}
                                            onChange={e => setFormData({ ...formData, approvalType: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Icon & Vibrant Theme Selection</label>
                                            <div className="relative w-48">
                                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input 
                                                    type="text"
                                                    placeholder="Search icons..."
                                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                                                    value={iconSearch}
                                                    onChange={e => setIconSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl custom-scrollbar border border-slate-100">
                                            {AVAILABLE_ICONS.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).map(iconName => {
                                                const PickerIcon = iconMap[iconName] || Icons.HelpCircle;
                                                const isSelected = formData.iconKey === iconName;
                                                return (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, iconKey: iconName })}
                                                        title={iconName}
                                                        className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                                            isSelected 
                                                            ? 'bg-indigo-600 text-white shadow-md scale-110' 
                                                            : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <PickerIcon size={18} />
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {THEME_MAP.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, backgroundColor: theme.id })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                                        formData.backgroundColor === theme.id 
                                                        ? 'border-slate-800 scale-110 ring-2 ring-slate-100' 
                                                        : 'border-transparent'
                                                    } ${theme.activeBg}`}
                                                    title={theme.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 flex gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                                    >
                                        {saving ? <Icons.Loader2 className="animate-spin" size={20} /> : <Icons.Check size={20} />}
                                        <span>{currentApproval ? 'Update Details' : 'Initialize Card'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for Manage Requests */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
                        >
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
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.approvalType}
                                                onChange={e => setRequestData({ ...requestData, approvalType: e.target.value })}
                                            >
                                                <option value="">Select Category</option>
                                                {Array.isArray(approvals) && approvals.map(app => (
                                                    <option key={app.sno} value={app.approvalType}>{app.cardTitle}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Reference Number</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                placeholder="e.g. PO/2025/001"
                                                value={requestData.poRefNo}
                                                onChange={e => setRequestData({ ...requestData, poRefNo: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Purchase Type</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.purchaseType}
                                                onChange={e => setRequestData({ ...requestData, purchaseType: e.target.value })}
                                            >
                                                <option value="LOCAL">Local Purchase</option>
                                                <option value="IMPORT">Import / International</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">PO Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                value={requestData.poDate}
                                                onChange={e => setRequestData({ ...requestData, poDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Company</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.companyId}
                                                onChange={e => setRequestData({ ...requestData, companyId: e.target.value })}
                                            >
                                                <option value="">Select Company</option>
                                                {Array.isArray(companies) && companies.map(c => (
                                                    <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Supplier</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.supplierId}
                                                onChange={e => setRequestData({ ...requestData, supplierId: e.target.value })}
                                            >
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
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.poStoreId}
                                                onChange={e => setRequestData({ ...requestData, poStoreId: e.target.value })}
                                            >
                                                <option value="">Select Department</option>
                                                {Array.isArray(stores) && stores.map(s => (
                                                    <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Currency</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.currencyType}
                                                onChange={e => setRequestData({ ...requestData, currencyType: e.target.value })}
                                            >
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
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Total Amount</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                                                    {requestData.currencyType === 'USD' ? '$' : requestData.currencyType}
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                    placeholder="0.00"
                                                    value={requestData.totalAmount}
                                                    onChange={e => setRequestData({ ...requestData, totalAmount: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Current Status</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={requestData.statusEntry}
                                                onChange={e => setRequestData({ ...requestData, statusEntry: e.target.value })}
                                            >
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
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                    value={requestData.requestedBy}
                                                    onChange={e => setRequestData({ ...requestData, requestedBy: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Remarks / Justification</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold min-h-[100px]"
                                            placeholder="Enter detailed justification for this approval request..."
                                            value={requestData.remarks}
                                            onChange={e => setRequestData({ ...requestData, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 flex gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                                    >
                                        {saving ? <Icons.Loader2 className="animate-spin" size={20} /> : <Icons.Check size={20} />}
                                        <span>{currentRequest ? 'Save Changes' : 'Submit Request'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApprovalsManagementPage;
