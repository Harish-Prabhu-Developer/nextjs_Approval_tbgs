"use client";

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Package, 
    Layers, 
    Tag, 
    CheckCircle2, 
    XCircle,
    Loader2,
    Check,
    Archive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProductsPage = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [mainCategories, setMainCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        productName: '',
        mainCategoryId: '',
        subCategoryId: '',
        unit: '',
        specification: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const [mainRes, subRes] = await Promise.all([
                fetch('/api/admin/categories?type=main'),
                fetch('/api/admin/categories?type=sub')
            ]);
            setMainCategories(await mainRes.json());
            setSubCategories(await subRes.json());
        } catch (error) {
            console.error('Category loading failed');
        }
    };

    const handleOpenModal = (product: any = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                productName: product.productName,
                mainCategoryId: product.mainCategoryId?.toString() || '',
                subCategoryId: product.subCategoryId?.toString() || '',
                unit: product.unit || '',
                specification: product.specification || '',
                status: product.status || 'Active'
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                productName: '',
                mainCategoryId: '',
                subCategoryId: '',
                unit: '',
                specification: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentProduct ? `/api/admin/products/${currentProduct.productId}` : '/api/admin/products';
            const method = currentProduct ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    mainCategoryId: formData.mainCategoryId ? Number(formData.mainCategoryId) : null,
                    subCategoryId: formData.subCategoryId ? Number(formData.subCategoryId) : null,
                })
            });
            
            if (response.ok) {
                toast.success(currentProduct ? 'Product updated' : 'Product created');
                fetchProducts();
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
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Product deleted');
                fetchProducts();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('System error');
        }
    };

    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMainCategoryName = (id: number) => {
        return mainCategories.find(c => c.mainCategoryId === id)?.categoryName || 'N/A';
    };

    const getSubCategoryName = (id: number) => {
        return subCategories.find(c => c.subCategoryId === id)?.subCategoryName || 'N/A';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage global inventory items and classifications</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                    <Plus size={20} />
                    <span>New Item</span>
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search products by name..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[280px] bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                    ))
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Archive size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                        <p className="text-sm text-slate-400">Add some products to your catalog</p>
                    </div>
                ) : filteredProducts.map((product) => (
                    <div key={product.productId} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 p-6 transition-all group relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <Package size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                product.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                                {product.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{product.productName}</h3>
                        <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <Tag size={12} className="mr-1" />
                            <span>Unit: {product.unit || 'Each'}</span>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center text-slate-500 text-xs">
                                <Layers size={14} className="mr-2 text-slate-300 shrink-0" />
                                <span className="truncate">{getMainCategoryName(product.mainCategoryId)} / {getSubCategoryName(product.subCategoryId)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-50">
                            <button 
                                onClick={() => handleOpenModal(product)}
                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl font-bold text-xs transition-all"
                            >
                                <Edit2 size={12} />
                                <span>Edit</span>
                            </button>
                            <button 
                                onClick={() => handleDelete(product.productId)}
                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                                    <h2 className="text-2xl font-bold text-slate-800">{currentProduct ? 'Modify' : 'New'} Catalog Entry</h2>
                                    <p className="text-sm text-slate-400 mt-1">Configure product logic and categorization</p>
                                </div>

                                <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Product Description</label>
                                        <input
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                            placeholder="Steel Beam HEB 200..."
                                            value={formData.productName}
                                            onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Main Category</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={formData.mainCategoryId}
                                                onChange={e => setFormData({ ...formData, mainCategoryId: e.target.value, subCategoryId: '' })}
                                            >
                                                <option value="">Select Category</option>
                                                {mainCategories.map(c => (
                                                    <option key={c.mainCategoryId} value={c.mainCategoryId}>{c.categoryName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Sub Category</label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                                value={formData.subCategoryId}
                                                onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}
                                            >
                                                <option value="">Select Sub</option>
                                                {subCategories
                                                    .filter(s => !formData.mainCategoryId || s.mainCategoryId === Number(formData.mainCategoryId))
                                                    .map(s => (
                                                    <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Unit of Measure</label>
                                            <input
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                                                placeholder="KG, PCS, MTR..."
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
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
                                                <option value="Active">Active / Sellable</option>
                                                <option value="Inactive">Discontinued</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Technical Specifications</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
                                            placeholder="Enter dimensions, grade, and other technical details..."
                                            value={formData.specification}
                                            onChange={e => setFormData({ ...formData, specification: e.target.value })}
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
                                        <span>{currentProduct ? 'Update Product' : 'Add to Catalog'}</span>
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

export default ProductsPage;
