"use client";

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Truck, 
    Mail, 
    Phone, 
    MapPin, 
    Hash,
    CheckCircle2, 
    XCircle,
    Loader2,
    Check,
    Building2,
    UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        supplierName: '',
        address: '',
        contactNo: '',
        email: '',
        taxNumber: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/suppliers');
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (supplier: any = null) => {
        if (supplier) {
            setCurrentSupplier(supplier);
            setFormData({
                supplierName: supplier.supplierName,
                address: supplier.address || '',
                contactNo: supplier.contactNo || '',
                email: supplier.email || '',
                taxNumber: supplier.taxNumber || '',
                status: supplier.status || 'Active'
            });
        } else {
            setCurrentSupplier(null);
            setFormData({
                supplierName: '',
                address: '',
                contactNo: '',
                email: '',
                taxNumber: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSupplier(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentSupplier ? `/api/admin/suppliers/${currentSupplier.supplierId}` : '/api/admin/suppliers';
            const method = currentSupplier ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                toast.success(currentSupplier ? 'Supplier updated' : 'Supplier created');
                fetchSuppliers();
                handleCloseModal();
            } else {
                toast.error('Operation failed');
            }
        } catch (error) {
            toast.error('System error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            const response = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Supplier deleted');
                fetchSuppliers();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('System error');
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Supplier Directory</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage vendor relations and contract information</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                    <Plus size={20} />
                    <span>Register Supplier</span>
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by supplier name or VAT/Tax ID..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[300px] bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                    ))
                ) : filteredSuppliers.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Truck size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No suppliers encountered</h3>
                        <p className="text-sm text-slate-400">Register a new vendor to get started</p>
                    </div>
                ) : filteredSuppliers.map((supplier) => (
                    <div key={supplier.supplierId} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 p-8 transition-all group relative">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Truck size={28} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {supplier.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{supplier.supplierName}</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-slate-500 text-sm">
                                <Hash size={16} className="mr-3 text-slate-300 shrink-0" />
                                <span className="font-mono text-xs bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                    Tax ID: {supplier.taxNumber || 'Pending'}
                                </span>
                            </div>
                            <div className="flex items-center text-slate-500 text-sm">
                                <MapPin size={16} className="mr-3 text-slate-300 shrink-0" />
                                <span className="truncate">{supplier.address || 'No location set'}</span>
                            </div>
                            <div className="flex items-center text-slate-500 text-sm">
                                <Mail size={16} className="mr-3 text-slate-300 shrink-0" />
                                <span className="truncate">{supplier.email || 'No email contact'}</span>
                            </div>
                        </div>

                        <div className="pt-6 mt-2 border-t border-slate-50 flex items-center gap-2">
                            <button 
                                onClick={() => handleOpenModal(supplier)}
                                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2"
                            >
                                <Edit2 size={12} />
                                <span>Modify</span>
                            </button>
                            <button 
                                onClick={() => handleDelete(supplier.supplierId)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden"
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 border-b border-slate-50 bg-linear-to-r from-indigo-50/50 to-white">
                                    <h2 className="text-2xl font-bold text-slate-800">{currentSupplier ? 'Update' : 'Register'} Supplier</h2>
                                    <p className="text-sm text-slate-400 mt-1">Global vendor registry configuration</p>
                                </div>

                                <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Vendor/Supplier Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                                placeholder="Global Logistics Co."
                                                value={formData.supplierName}
                                                onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Tax / VAT Number</label>
                                            <input
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                                                placeholder="TRA-987-654-321"
                                                value={formData.taxNumber}
                                                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Primary Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="vendor@company.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Contact Phone</label>
                                            <input
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="+255..."
                                                value={formData.contactNo}
                                                onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Status</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="Active">Active / Approved</option>
                                                <option value="Inactive">Blacklisted / Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Registered Address</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
                                            placeholder="Enter full office or warehouse address..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        <span>{currentSupplier ? 'Update Vendor' : 'Onboard Supplier'}</span>
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

export default SuppliersPage;
