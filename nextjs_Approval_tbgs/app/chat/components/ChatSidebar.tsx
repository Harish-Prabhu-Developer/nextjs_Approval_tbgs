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
    const [newChatSearch, setNewChatSearch] = useState('');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    // Main list: only show users who have chat history (message OR file/image)
    const chattedUsers = users
        .filter(user =>
            user.id !== currentUser?.id &&
            (user.lastMessage || user.lastFileUrl) // Only show if there is history
        )
        .filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

    // New chat panel: ALL contacts (no history filter)
    const allContacts = users
        .filter(user =>
            user.id !== currentUser?.id &&
            (user.name.toLowerCase().includes(newChatSearch.toLowerCase()) ||
                user.username.toLowerCase().includes(newChatSearch.toLowerCase()))
        );

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

    const getLastMessagePreview = (user: User) => {
        if (user.isTyping) return 'typing...';
        if (user.lastMessage) return user.lastMessage;
        if (user.lastFileUrl) {
            return user.lastFileType?.startsWith('image/') ? '📷 Photo' : '📄 File';
        }
        return '';
    };

    return (
        <div className="w-full md:w-80 h-full flex flex-col bg-white border-r border-slate-200 relative">
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

            {/* Users List — only those with chat history */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {isLoading ? (
                    <SkeletonLoader />
                ) : chattedUsers.length > 0 ? (
                    chattedUsers.map((user) => (
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
                                        {getLastMessagePreview(user)}
                                    </p>
                                    {user.unreadCount && user.unreadCount > 0 && (
                                        <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-5 flex items-center justify-center shadow-lg shadow-emerald-200">
                                            {user.unreadCount > 9 ? '9+' : user.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    // Empty state
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl shadow-xs flex items-center justify-center mb-5 border border-dashed border-slate-200">
                            <MessageSquare size={36} className="text-slate-300" />
                        </div>
                        <h4 className="text-slate-700 font-bold mb-1 text-base">No conversations yet</h4>
                        <p className="text-xs leading-relaxed text-slate-400 mb-5">
                            {searchTerm ? `No chats matching "${searchTerm}"` : 'Tap below to start your first chat!'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                <span>Start New Chat</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Floating WhatsApp-style Button — only visible when there are chats */}
                {chattedUsers.length > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsNewChatOpen(true)}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200/60 flex items-center justify-center z-20 cursor-pointer overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Plus size={28} strokeWidth={2.5} />
                    </motion.button>
                )}
            </div>

            {/* New Chat Slide-in Panel */}
            <AnimatePresence>
                {isNewChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="absolute inset-0 z-30 bg-white flex flex-col"
                    >
                        {/* Panel Header */}
                        <div className="p-4 bg-emerald-600 text-white flex items-center space-x-4 shadow-lg">
                            <button
                                onClick={() => { setIsNewChatOpen(false); setNewChatSearch(''); }}
                                className="hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="font-bold text-lg">New Message</h2>
                        </div>

                        {/* Panel Search — uses its own state, NOT the main searchTerm */}
                        <div className="p-3 bg-emerald-50 border-b border-emerald-100">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-hidden"
                                    autoFocus
                                    value={newChatSearch}
                                    onChange={(e) => setNewChatSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Contacts List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="px-5 py-2.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50 border-b border-emerald-50">
                                All Contacts — {allContacts.length}
                            </div>
                            {allContacts.length > 0 ? allContacts.map(user => (
                                <motion.div
                                    key={user.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onSelectUser(user.id);
                                        setIsNewChatOpen(false);
                                        setNewChatSearch('');
                                    }}
                                    className="flex items-center p-3.5 mx-2 my-1 hover:bg-emerald-50 rounded-xl cursor-pointer transition-all"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        {user.status?.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                                        <p className="text-[10px] font-semibold">
                                            {user.status?.isOnline ? (
                                                <span className="text-emerald-500">● Online</span>
                                            ) : (
                                                <span className="text-slate-400">@{user.username}</span>
                                            )}
                                        </p>
                                    </div>
                                    {(user.lastMessage || user.lastFileUrl) && (
                                        <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full font-bold border border-indigo-100">
                                            Chat exists
                                        </span>
                                    )}
                                </motion.div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                                    <UserPlus size={40} className="text-slate-200 mb-4" />
                                    <p className="text-sm font-semibold">No contacts found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
