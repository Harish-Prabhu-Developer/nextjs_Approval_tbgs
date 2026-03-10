"use client";

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    CheckCircle2, 
    XCircle,
    Loader2,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CompaniesPage = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        address: '',
        contactNo: '',
        email: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/companies');
            const data = await response.json();
            setCompanies(data);
        } catch (error) {
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (company: any = null) => {
        if (company) {
            setCurrentCompany(company);
            setFormData({
                companyName: company.companyName,
                address: company.address || '',
                contactNo: company.contactNo || '',
                email: company.email || '',
                status: company.status || 'Active'
            });
        } else {
            setCurrentCompany(null);
            setFormData({
                companyName: '',
                address: '',
                contactNo: '',
                email: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCompany(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentCompany ? `/api/admin/companies/${currentCompany.companyId}` : '/api/admin/companies';
            const method = currentCompany ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                toast.success(currentCompany ? 'Company updated' : 'Company created');
                fetchCompanies();
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
        if (!confirm('Are you sure you want to delete this company?')) return;
        try {
            const response = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Company deleted');
                fetchCompanies();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('System error');
        }
    };

    const filteredCompanies = companies.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Company Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage corporate entities and branch information</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                    <Plus size={20} />
                    <span>Add Company</span>
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search companies by name or email..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[280px] bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                    ))
                ) : filteredCompanies.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Building2 size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No companies found</h3>
                        <p className="text-sm text-slate-400">Try adjusting your search or add a new company</p>
                    </div>
                ) : filteredCompanies.map((company) => (
                    <div key={company.companyId} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 p-8 transition-all group relative">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                <Building2 size={28} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                company.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                                {company.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">{company.companyName}</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-slate-500 text-sm">
                                <MapPin size={16} className="mr-3 text-slate-300" />
                                <span className="truncate">{company.address || 'No address provided'}</span>
                            </div>
                            <div className="flex items-center text-slate-500 text-sm">
                                <Mail size={16} className="mr-3 text-slate-300" />
                                <span className="truncate">{company.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center text-slate-500 text-sm">
                                <Phone size={16} className="mr-3 text-slate-300" />
                                <span>{company.contactNo || 'No contact'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-50">
                            <button 
                                onClick={() => handleOpenModal(company)}
                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl font-bold text-sm transition-all"
                            >
                                <Edit2 size={14} />
                                <span>Edit</span>
                            </button>
                            <button 
                                onClick={() => handleDelete(company.companyId)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                                <div className="p-8 border-b border-slate-50">
                                    <h2 className="text-2xl font-bold text-slate-800">{currentCompany ? 'Edit' : 'Add'} Company</h2>
                                    <p className="text-sm text-slate-400 mt-1">Provide the core details for this entity</p>
                                </div>

                                <div className="p-8 space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Company Name</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                            placeholder="Vision Infotech Ltd"
                                            value={formData.companyName}
                                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Official Address</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium min-h-[80px]"
                                            placeholder="Enter full physical address..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Contact Number</label>
                                            <input
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="+255 123 456 789"
                                                value={formData.contactNo}
                                                onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="office@vision.co.tz"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Operational Status</label>
                                        <div className="flex gap-3">
                                            {['Active', 'Inactive'].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status })}
                                                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                                        formData.status === status 
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                                                        : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {status === 'Active' ? <CheckCircle2 className="inline-block mr-2" size={16} /> : <XCircle className="inline-block mr-2" size={16} />}
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 flex gap-3">
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
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        <span>{currentCompany ? 'Save Changes' : 'Create Company'}</span>
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

export default CompaniesPage;
