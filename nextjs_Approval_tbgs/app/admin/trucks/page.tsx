"use client";

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Truck, 
    CheckCircle2, 
    XCircle,
    Loader2,
    Check,
    Navigation,
    ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TrucksPage = () => {
    const [trucks, setTrucks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTruck, setCurrentTruck] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        truckNumber: ''
    });

    useEffect(() => {
        fetchTrucks();
    }, []);

    const fetchTrucks = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/trucks');
            const data = await response.json();
            setTrucks(data);
        } catch (error) {
            toast.error('Failed to load fleet');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (truck: any = null) => {
        if (truck) {
            setCurrentTruck(truck);
            setFormData({
                truckNumber: truck.truckNumber
            });
        } else {
            setCurrentTruck(null);
            setFormData({
                truckNumber: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTruck(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentTruck ? `/api/admin/trucks/${currentTruck.truckId}` : '/api/admin/trucks';
            const method = currentTruck ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                toast.success(currentTruck ? 'Truck registration updated' : 'Truck registered');
                fetchTrucks();
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
        if (!confirm('Are you sure you want to delete this truck?')) return;
        try {
            const response = await fetch(`/api/admin/trucks/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Truck removed from fleet');
                fetchTrucks();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('System error');
        }
    };

    const filteredTrucks = trucks.filter(t => 
        t.truckNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Registry of authorized transport vehicles</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                    <Plus size={20} />
                    <span>Register Truck</span>
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by license plate / truck #..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[200px] bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                    ))
                ) : filteredTrucks.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Navigation size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Fleet is empty</h3>
                        <p className="text-sm text-slate-400">Add truck registration numbers to begin</p>
                    </div>
                ) : filteredTrucks.map((truck) => (
                    <div key={truck.truckId} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 p-6 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                        
                        <div className="relative">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-6">
                                <Truck size={24} />
                            </div>

                            <div className="space-y-1 mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">License Plate</span>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{truck.truckNumber}</h3>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center space-x-2 text-emerald-600">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Authorized</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={() => handleOpenModal(truck)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(truck.truckId)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
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
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-md relative overflow-hidden"
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 border-b border-slate-50">
                                    <h2 className="text-2xl font-bold text-slate-800">{currentTruck ? 'Edit' : 'Register'} Vehicle</h2>
                                    <p className="text-sm text-slate-400 mt-1">Authorized fleet registration</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Registration Number / Plate</label>
                                        <div className="relative">
                                            <input
                                                required
                                                autoFocus
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xl font-black text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-hidden transition-all uppercase placeholder:normal-case placeholder:font-bold placeholder:text-slate-300"
                                                placeholder="e.g. T 123 ABC"
                                                value={formData.truckNumber}
                                                onChange={e => setFormData({ ...formData, truckNumber: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-1">Enter exactly as it appears on the vehicle plates</p>
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
                                        <span>{currentTruck ? 'Save Changes' : 'Register Vehicle'}</span>
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

export default TrucksPage;
