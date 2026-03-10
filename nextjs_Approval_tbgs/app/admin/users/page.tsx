"use client";

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    UserPlus, 
    Shield, 
    User, 
    MoreVertical, 
    Check, 
    X, 
    Loader2, 
    UserCheck, 
    UserMinus,
    Mail,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [dashboardCards, setDashboardCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'user',
        permissions: [] as string[],
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, cardsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/approvals')
            ]);
            
            const usersData = await usersRes.json();
            const cardsData = await cardsRes.json();
            
            setUsers(usersData);
            setDashboardCards(cardsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user: any = null) => {
        if (user) {
            setCurrentUser(user);
            setFormData({
                username: user.username,
                password: user.password,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                permissions: user.permissions || [],
                isActive: user.isActive ?? true
            });
        } else {
            setCurrentUser(null);
            setFormData({
                username: '',
                password: '',
                name: '',
                email: '',
                role: 'user',
                permissions: [],
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = currentUser ? `/api/admin/users/${currentUser.id}` : '/api/admin/users';
            const method = currentUser ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                toast.success(currentUser ? 'User updated' : 'User created');
                fetchData();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Action failed');
            }
        } catch (error) {
            toast.error('Internal server error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('User deleted');
                fetchData();
            } else {
                toast.error('Failed to delete user');
            }
        } catch (error) {
            toast.error('Internal server error');
        }
    };

    const togglePermission = (permission: string) => {
        const newPermissions = formData.permissions.includes(permission)
            ? formData.permissions.filter(p => p !== permission)
            : [...formData.permissions, permission];
        setFormData({ ...formData, permissions: newPermissions });
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage system access and permissions</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all font-medium"
                >
                    <UserPlus size={18} />
                    <span>Create User</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, username or email..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Permissions</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-100 rounded w-28" />
                                                    <div className="h-3 bg-slate-50 rounded w-40" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-100 rounded float-right" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                {(user.name || user.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-400">@{user.username} • {user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center w-fit space-x-1 ${
                                            user.role?.toLowerCase() === 'admin' 
                                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            <Shield size={10} />
                                            <span>{user.role}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                                            {user.permissions?.length > 0 ? (
                                                user.permissions.slice(0, 3).map((perm: string) => (
                                                    <span key={perm} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                                        {perm}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-300 text-[10px] italic">No permissions</span>
                                            )}
                                            {user.permissions?.length > 3 && (
                                                <span className="text-[10px] text-indigo-400 font-bold">+{user.permissions.length - 3} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center space-x-1.5 ${user.isActive ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'}`} />
                                            <span className="text-xs font-bold">{user.isActive ? 'Active' : 'Inactive'}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x" />
                            
                            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            {currentUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">{currentUser ? 'Edit' : 'Create'} User</h2>
                                            <p className="text-xs text-slate-400">Fill in the details below</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                                    placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Username</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                                    placeholder="johndoe"
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="password"
                                                    required={!currentUser}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                                    placeholder={currentUser ? "Leave empty to keep current" : "••••••••"}
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Account Role</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: 'user' })}
                                                    className={`py-3 rounded-2xl text-sm font-bold flex flex-col items-center justify-center space-y-1 transition-all border-2 ${
                                                        formData.role?.toLowerCase() === 'user' 
                                                        ? 'bg-blue-50 border-indigo-500 text-indigo-700' 
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <User size={18} />
                                                    <span>User</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                                    className={`py-3 rounded-2xl text-sm font-bold flex flex-col items-center justify-center space-y-1 transition-all border-2 ${
                                                        formData.role?.toLowerCase() === 'admin' 
                                                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <Shield size={18} />
                                                    <span>Admin</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Account Status</label>
                                            <div className="flex items-center mt-2">
                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={formData.isActive}
                                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                                                    <span className="ml-3 text-sm font-bold text-slate-700">{formData.isActive ? 'Active and Enabeled' : 'Disabled and Locked'}</span>
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Disabled users cannot log in to the system.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Access Permissions</label>
                                            <span className="text-[10px] bg-indigo-50 text-indigo-500 font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {formData.permissions.length} Assigned
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                            {dashboardCards.length === 0 ? (
                                                <div className="col-span-2 text-center py-4 text-slate-400 italic text-xs">
                                                    No dashboard cards available to assign
                                                </div>
                                            ) : (
                                                dashboardCards.map(card => {
                                                    const isChecked = formData.permissions.includes(card.permissionColumn);
                                                    return (
                                                        <label 
                                                            key={card.sno} 
                                                            className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all border ${
                                                                isChecked 
                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                                                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${
                                                                isChecked ? 'bg-indigo-600' : 'bg-slate-100'
                                                            }`}>
                                                                {isChecked && <Check size={14} className="text-white" />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden" 
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(card.permissionColumn)}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold truncate leading-none mb-1">{card.cardTitle}</div>
                                                                <div className="text-[10px] opacity-70 font-medium truncate">{card.permissionColumn}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <UserCheck size={20} />
                                        )}
                                        <span>{currentUser ? 'Update User' : 'Create Account'}</span>
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

export default UsersPage;
