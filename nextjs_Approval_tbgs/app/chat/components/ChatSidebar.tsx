"use client";

import React, { useState } from 'react';
import { Search, MoreVertical, MessageSquare, Plus, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessageTime } from '../utils/time';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    lastMessage?: string;
    lastMessageTime?: string;
    lastFileUrl?: string;
    lastFileType?: string;
    unreadCount?: number;
    isTyping?: boolean;
    status: {
        isOnline: boolean;
        lastSeen: string;
    };
}

interface ChatSidebarProps {
    users: User[];
    currentUser: any;
    selectedUserId: number | null;
    onSelectUser: (userId: number) => void;
    isLoading?: boolean;
}

export default function ChatSidebar({ users, currentUser, selectedUserId, onSelectUser, isLoading }: ChatSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    const filteredUsers = users
        .filter(user =>
            user.id !== currentUser?.id &&
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

    const SkeletonLoader = () => (
        <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full md:w-80 h-full flex flex-col bg-white border-r border-slate-200">
            {/* Sidebar Header */}
            <div className="p-4 bg-white flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <h2 className="font-bold text-slate-800 text-lg">Messages</h2>
                </div>
                <div className="flex items-center space-x-1">
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <MessageSquare size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-hidden"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {isLoading ? (
                    <SkeletonLoader />
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelectUser(user.id)}
                            className={`flex items-center p-3.5 mx-2 my-1 cursor-pointer transition-all rounded-xl ${selectedUserId === user.id
                                ? 'bg-indigo-50 shadow-xs'
                                : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="relative shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${selectedUserId === user.id ? 'bg-indigo-500' : 'bg-linear-to-tr from-slate-400 to-slate-500'
                                    }`}>
                                    {user.name.charAt(0)}
                                </div>
                                {user.status?.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm ring-2 ring-emerald-500/20"></span>
                                )}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`text-sm font-bold truncate ${selectedUserId === user.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {user.name}
                                    </h3>
                                    <span className={`text-[10px] whitespace-nowrap ${user.unreadCount && user.unreadCount > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                        {formatMessageTime(user.lastMessageTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate flex-1 pr-2 ${user.isTyping
                                        ? 'text-emerald-500 font-black tracking-wide'
                                        : (user.unreadCount && user.unreadCount > 0
                                            ? 'text-slate-900 font-semibold'
                                            : (selectedUserId === user.id ? 'text-indigo-600/80' : 'text-slate-500'))
                                        }`}>
                                        {user.isTyping ? 'typing...' : (
                                            user.lastMessage ? user.lastMessage : (
                                                user.lastFileUrl ? (user.lastFileType?.startsWith('image/') ? '📷 Photo' : '📄 File') : user.username
                                            )
                                        )}
                                    </p>
                                    {user.unreadCount && user.unreadCount > 0 && (
                                        <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-5 flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce-subtle">
                                            {user.unreadCount > 9 ? '9+' : user.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/30 mx-3 my-2 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                            <UserPlus size={32} className="text-slate-300" />
                        </div>
                        <h4 className="text-slate-600 font-bold mb-1">No chats found</h4>
                        <p className="text-xs leading-relaxed">Start a new conversation with someone from your network.</p>
                    </div>
                )}

                {/* Floating WhatsApp Style Button */}
                <motion.button
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsNewChatOpen(true)}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200/60 flex items-center justify-center z-20 cursor-pointer overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                        <Plus size={28} strokeWidth={2.5} />
                    </div>
                </motion.button>
            </div>

            {/* New Chat Modal/Overlay */}
            <AnimatePresence>
                {isNewChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="absolute inset-0 z-30 bg-white flex flex-col"
                    >
                        <div className="p-4 bg-emerald-600 text-white flex items-center space-x-4 shadow-lg shadow-emerald-100">
                            <button onClick={() => setIsNewChatOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors cursor-pointer">
                                <X size={24} />
                            </button>
                            <h2 className="font-bold text-lg">New Message</h2>
                        </div>

                        <div className="p-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-hidden"
                                    autoFocus
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="px-5 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50 mb-2">
                                Contacts
                            </div>
                            {users.filter(u => u.id !== currentUser.id).map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        onSelectUser(user.id);
                                        setIsNewChatOpen(false);
                                    }}
                                    className="flex items-center p-3.5 mx-2 my-1 hover:bg-slate-50 rounded-xl cursor-pointer transition-all border-b border-slate-50/50"
                                >
                                    <div className="w-11 h-11 rounded-full bg-linear-to-br from-slate-100 to-slate-200 border border-slate-200/50 flex items-center justify-center text-slate-500 font-bold shadow-xs">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{user.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
