"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Send, Paperclip, Smile, MoreHorizontal, Phone, Video, Search, MessageSquare, Check, CheckCheck, ChevronLeft, Download, File, FileText, Image as ImageIcon, X, Trash2, DownloadCloud, CornerUpLeft, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessageTime, parseDate } from '../utils/time';
import axios from 'axios';
import ExpandableText from '@/app/components/ExpandableText';
import { toast } from 'react-hot-toast';

// Dynamically import to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ReplyTo {
    id: number;
    senderId: number;
    message: string;
    fileType?: string;
    fileUrl?: string;
    fileName?: string;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    message: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    createdAt: string;
    isRead: boolean;
    isSending?: boolean;
    replyTo?: ReplyTo | null;
}

interface User {
    id: number;
    name: string;
    username: string;
    status: {
        isOnline: boolean;
        lastSeen: string;
    };
}

interface ChatWindowProps {
    recipient: User | null;
    currentUser: any;
    messages: Message[];
    onSendMessage: (text: string, fileData?: any) => void;
    onTyping?: (isTyping: boolean) => void;
    isRecipientTyping?: boolean;
    isConnected: boolean;
    onBack?: () => void;
    onClearChat: () => void;
    onDeleteMessage: (id: number) => void;
}

export default function ChatWindow({ recipient, currentUser, messages, onSendMessage, onTyping, isRecipientTyping, isConnected, onBack, onClearChat, onDeleteMessage }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
    const [messageMenuData, setMessageMenuData] = useState<{ message: Message, x: number, y: number } | null>(null);
    const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
    const [showStatusAlt, setShowStatusAlt] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Grouping and Date logic
    const chatContent = useMemo(() => {
        const filteredMessages = searchTerm
            ? messages.filter(m => m.message.toLowerCase().includes(searchTerm.toLowerCase()))
            : messages;

        const groups: any[] = [];
        let lastDate = "";

        filteredMessages.forEach((msg, idx) => {
            const msgDate = new Date(msg.createdAt).toDateString();

            if (msgDate !== lastDate) {
                const now = new Date();
                const msgDateObj = new Date(msg.createdAt);
                let label = "";

                if (msgDate === now.toDateString()) {
                    label = "Today";
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(now.getDate() - 1);
                    if (msgDate === yesterday.toDateString()) {
                        label = "Yesterday";
                    } else {
                        label = msgDateObj.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
                    }
                }

                groups.push({ type: 'date', label });
                lastDate = msgDate;
            }

            const isFirstInGroup = idx === 0 || filteredMessages[idx - 1].senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(filteredMessages[idx - 1].createdAt).getTime() > 300000);
            const isLastInGroup = idx === filteredMessages.length - 1 || filteredMessages[idx + 1].senderId !== msg.senderId || (new Date(filteredMessages[idx + 1].createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000);

            groups.push({
                ...msg,
                type: 'message',
                isFirstInGroup,
                isLastInGroup
            });
        });

        return groups;
    }, [messages, searchTerm]);

    const getHighlightedText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => (
                    <span key={i} className={part.toLowerCase() === highlight.toLowerCase() ? 'bg-yellow-200 text-slate-900 rounded-sm' : ''}>
                        {part}
                    </span>
                ))}
            </span>
        );
    };

    const scrollToBottom = (instant = false) => {
        if (scrollRef.current && !searchTerm) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }
    };

    const scrollToMessage = (messageId: number) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000); // Highlight for 2 seconds
        }
    };

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    // Insert emoji at cursor position
    const handleEmojiClick = useCallback((emojiData: any) => {
        const emoji = emojiData.emoji;
        const textarea = textareaRef.current;
        if (!textarea) {
            setInputValue(prev => prev + emoji);
            return;
        }
        const start = textarea.selectionStart ?? inputValue.length;
        const end = textarea.selectionEnd ?? inputValue.length;
        const newValue = inputValue.slice(0, start) + emoji + inputValue.slice(end);
        setInputValue(newValue);
        // Restore cursor after emoji
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.selectionStart = start + emoji.length;
            textarea.selectionEnd = start + emoji.length;
        });
    }, [inputValue]);

    // Cleanup typing state when switching conversations
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (onTyping) onTyping(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipient?.id]);

    useEffect(() => {
        let interval: any;
        if (recipient?.status?.isOnline) {
            interval = setInterval(() => {
                setShowStatusAlt(prev => !prev);
            }, 3000);
        } else {
            setShowStatusAlt(false);
        }
        return () => clearInterval(interval);
    }, [recipient?.status?.isOnline, recipient?.id]);

    const statusText = useMemo(() => {
        if (!recipient?.status?.isOnline) return `Last seen ${formatMessageTime(recipient?.status?.lastSeen)}`;
        return showStatusAlt ? `Last seen ${formatMessageTime(recipient?.status?.lastSeen)}` : 'Available now';
    }, [recipient?.status?.isOnline, recipient?.status?.lastSeen, showStatusAlt]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isRecipientTyping]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue, replyingTo ? { replyTo: replyingTo } : undefined);
            setInputValue('');
            setReplyingTo(null);
            if (onTyping) onTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Immediate callback with the actual File object
        onSendMessage('', {
            fileObject: file,
            fileName: file.name,
            fileType: file.type
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (!onTyping) return;

        if (!val.trim()) {
            // Input cleared — stop typing immediately
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            onTyping(false);
            return;
        }

        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const handleClearChat = async () => {
        if (!recipient) return;
        if (confirm(`Are you sure you want to clear all messages with ${recipient.name}? This cannot be undone.`)) {
            try {
                await axios.post('/api/chat/clear', {
                    userId: currentUser.id,
                    targetId: recipient.id
                });
                onClearChat();
                setShowMenu(false);
            } catch (err) {
                console.error("Failed to clear chat:", err);
                alert("Failed to clear chat. Please try again.");
            }
        }
    };

    const exportChat = () => {
        if (!recipient || messages.length === 0) return;

        const chatHeader = `Chat history with ${recipient.name}\nExported on: ${new Date().toLocaleString()}\n-------------------------------------------\n\n`;
        const chatBody = messages.map(m => {
            const time = new Date(m.createdAt).toLocaleString();
            const sender = Number(m.senderId) === Number(currentUser.id) ? 'Me' : recipient.name;
            return `[${time}] ${sender}: ${m.message || (m.fileUrl ? '[Attachment]' : '')}`;
        }).join('\n');

        const element = document.createElement("a");
        const file = new Blob([chatHeader + chatBody], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `chat_with_${recipient.username}.txt`;
        document.body.appendChild(element);
        element.click();
        setShowMenu(false);
    };

    const handleCopyMessage = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Message copied to clipboard');
        setMessageMenuData(null);
    }, []);

    const handleShareMessage = useCallback(async (message: Message) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Shared from Chat',
                    text: message.message,
                    url: message.fileUrl
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            toast.error('Sharing not supported on this browser');
        }
        setMessageMenuData(null);
    }, []);

    const toggleMessageSelection = useCallback((messageId: number) => {
        setSelectedMessageIds(prev =>
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    }, []);

    const handleBulkDelete = useCallback(async () => {
        if (!selectedMessageIds.length) return;
        if (confirm(`Delete ${selectedMessageIds.length} messages?`)) {
            try {
                for (const id of selectedMessageIds) {
                    await axios.delete(`/api/chat/messages/${id}`);
                    onDeleteMessage(id);
                }
                toast.success('Messages deleted');
                setSelectedMessageIds([]);
            } catch (err) {
                console.error("Failed to bulk delete:", err);
                toast.error("Failed to delete some messages");
            }
        }
    }, [selectedMessageIds, onDeleteMessage]);

    const handleBulkCopy = useCallback(() => {
        if (!selectedMessageIds.length) return;
        const selectedMsgs = messages.filter(m => selectedMessageIds.includes(m.id));
        const textToCopy = selectedMsgs
            .map(m => {
                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sender = Number(m.senderId) === Number(currentUser.id) ? 'Me' : recipient?.name;
                return `[${time}] ${sender}: ${m.message}`;
            })
            .join('\n');
        navigator.clipboard.writeText(textToCopy);
        toast.success(`${selectedMessageIds.length} messages copied`);
        setSelectedMessageIds([]);
    }, [selectedMessageIds, messages, currentUser.id, recipient?.name]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        if (confirm('Delete message?')) {
            try {
                await axios.delete(`/api/chat/messages/${messageId}`);
                onDeleteMessage(messageId);
                toast.success('Message deleted');
                setMessageMenuData(null);
            } catch (err) {
                console.error("Failed to delete message:", err);
                toast.error("Failed to delete message");
            }
        }
    }, [onDeleteMessage]);

    if (!recipient) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-linear-to-tr from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-xs"
                >
                    <MessageSquare size={48} className="text-slate-300" />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Select a Chat</h2>
                <p className="max-w-xs text-center mt-3 text-sm leading-relaxed text-slate-500 font-medium">Pick a teammate and start your real-time conversation.</p>
                <div className="mt-10 flex items-center space-x-2 text-[10px] uppercase font-black tracking-widest text-indigo-400/60">
                    <span>SECURE</span>
                    <span className="w-1 h-1 bg-indigo-200 rounded-full"></span>
                    <span>REAL-TIME</span>
                    <span className="w-1 h-1 bg-indigo-200 rounded-full"></span>
                    <span>PRIVATE</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-white relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Chat Header or Selection Header */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 overflow-hidden min-h-[64px]">
                <AnimatePresence mode="wait">
                    {selectedMessageIds.length > 0 ? (
                        <motion.div
                            key="selection-header"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="flex-1 flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-6">
                                <button
                                    onClick={() => setSelectedMessageIds([])}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X size={24} className="text-slate-600" strokeWidth={2.5} />
                                </button>
                                <span className="text-lg font-black text-slate-800">{selectedMessageIds.length} <span className="text-sm font-bold text-slate-500 uppercase ml-1 tracking-widest">Selected</span></span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-500">
                                <button
                                    onClick={handleBulkCopy}
                                    className="p-3 hover:bg-slate-100 rounded-xl transition-all hover:text-indigo-600 group"
                                    title="Copy"
                                >
                                    <Copy size={20} strokeWidth={2.5} className="group-active:scale-90" />
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="p-3 hover:bg-red-50 rounded-xl transition-all hover:text-red-600 group"
                                    title="Delete"
                                >
                                    <Trash2 size={20} strokeWidth={2.5} className="group-active:scale-90" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-header"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="flex-1 flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-xl md:hidden transition-all active:scale-90">
                                    <ChevronLeft size={24} strokeWidth={2.5} className="text-slate-700" />
                                </button>

                                <div className="relative group">
                                    <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg rotate-1 group-hover:rotate-3 transition-transform">
                                        {recipient.name.charAt(0)}
                                    </div>
                                    {recipient.status?.isOnline && (
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md ring-2 ring-emerald-500/10"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm md:text-base tracking-tight leading-none mb-1">{recipient.name}</h3>
                                    <div className="flex items-center space-x-1.5">
                                        {isRecipientTyping ? (
                                            <p className="text-[10px] md:text-xs font-black text-indigo-500 uppercase tracking-widest animate-pulse">Typing...</p>
                                        ) : (
                                            <>
                                                <span className={`w-1.5 h-1.5 rounded-full ${recipient.status?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                <div className="h-4 flex items-center overflow-hidden">
                                                    <AnimatePresence mode="wait">
                                                        <motion.p
                                                            key={statusText}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="text-[10px] md:text-xs font-semibold text-slate-400"
                                                        >
                                                            {statusText}
                                                        </motion.p>
                                                    </AnimatePresence>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 text-slate-400">
                                <AnimatePresence>
                                    {isSearchVisible && (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 'auto', opacity: 1 }}
                                            exit={{ width: 0, opacity: 0 }}
                                            className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2 h-10 overflow-hidden"
                                        >
                                            <input
                                                autoFocus
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search chat..."
                                                className="bg-transparent border-none outline-none text-xs font-bold px-2 w-24 sm:w-40 text-slate-600 uppercase tracking-widest placeholder:text-slate-300"
                                            />
                                            <button
                                                onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }}
                                                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                <X size={14} className="text-slate-400" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={() => setIsSearchVisible(!isSearchVisible)}
                                    className={`p-2.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer hover:text-indigo-600 active:scale-90 ${isSearchVisible ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : ''}`}
                                >
                                    <Search size={18} strokeWidth={2.5} />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className={`p-2.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer hover:text-indigo-600 active:scale-90 ${showMenu ? 'bg-slate-100 text-indigo-600' : ''}`}
                                    >
                                        <MoreHorizontal size={18} strokeWidth={2.5} />
                                    </button>

                                    <AnimatePresence>
                                        {showMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                                                >
                                                    <div className="px-4 py-2 border-b border-slate-50">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversation Actions</p>
                                                    </div>
                                                    <button
                                                        onClick={exportChat}
                                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                            <DownloadCloud size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">Export Chat</span>
                                                    </button>
                                                    <button
                                                        onClick={handleClearChat}
                                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100">
                                                            <Trash2 size={16} />
                                                        </div>
                                                        <span className="text-sm font-bold text-red-600">Clear Chat</span>
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search Results Banner */}
            <AnimatePresence>
                {isSearchVisible && searchTerm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-500 tracking-widest uppercase">
                                {chatContent.filter(i => i.type === 'message').length} result(s) for &quot;{searchTerm}&quot;
                            </span>
                            <button
                                onClick={() => { setSearchTerm(''); setIsSearchVisible(false); }}
                                className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest"
                            >
                                Clear
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 pb-2 bg-[#F6F8FC] custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                <div className="max-w-4xl mx-auto space-y-1">
                    <AnimatePresence initial={false}>
                        {chatContent.map((item, idx) => {
                            if (item.type === 'date') {
                                return (
                                    <div key={`date-${idx}`} className="flex justify-center my-8">
                                        <span className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 shadow-xs">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }

                            const isOwn = Number(item.senderId) === Number(currentUser.id);
                            const showTail = item.isFirstInGroup;
                            const isImage = item.fileType?.startsWith('image/');
                            const replyOwner = Number(item.replyTo?.senderId) === Number(currentUser.id) ? 'You' : recipient?.name;

                            return (
                                <motion.div
                                    key={item.id || `msg-${idx}`}
                                    id={`message-${item.id}`}
                                    initial={{ opacity: 0, scale: 0.95, x: isOwn ? 10 : -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    className={`flex w-full mb-1 items-end ${isOwn ? 'justify-end' : 'justify-start'} ${item.isFirstInGroup ? 'mt-4' : 'mt-0.5'} group/msg transition-all duration-500 rounded-lg ${highlightedMessageId === item.id ? 'z-10' : ''} ${selectedMessageIds.includes(item.id) ? 'bg-indigo-50/40 py-2 -mx-2 px-2' : ''}`}
                                    onClick={() => {
                                        if (selectedMessageIds.length > 0) {
                                            toggleMessageSelection(item.id);
                                        }
                                    }}
                                >
                                    {/* Reply button — appears on hover, on the opposite side of the message */}
                                    {!isOwn && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReplyingTo({ id: item.id, senderId: item.senderId, message: item.message, fileType: item.fileType, fileUrl: item.fileUrl, fileName: item.fileName });
                                                textareaRef.current?.focus();
                                            }}
                                            className="mr-2 p-1.5 rounded-full bg-white/80 border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover/msg:opacity-100 scale-75 group-hover/msg:scale-100 shrink-0 mb-4"
                                        >
                                            <CornerUpLeft size={14} strokeWidth={2.5} />
                                        </button>
                                    )}

                                    <div
                                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl shadow-xs relative transition-all duration-500 cursor-pointer ${isOwn
                                            ? `bg-indigo-600 text-white ${showTail ? 'rounded-tr-xs' : 'rounded-tr-2xl'}`
                                            : `bg-white text-slate-800 border border-slate-100 ${showTail ? 'rounded-tl-xs' : 'rounded-tl-2xl'}`
                                            } ${isImage ? 'p-1' : 'px-4 py-2.5'} ${highlightedMessageId === item.id ? (isOwn ? 'ring-4 ring-indigo-400/50 scale-105' : 'ring-4 ring-indigo-500/30 scale-105 bg-indigo-50') : ''} ${selectedMessageIds.includes(item.id) ? (isOwn ? 'ring-4 ring-indigo-300 opacity-90 backdrop-blur-md' : 'ring-4 ring-indigo-200 bg-indigo-50/80') : ''}`}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (selectedMessageIds.length === 0) {
                                                setMessageMenuData({ message: item, x: e.pageX, y: e.pageY });
                                            }
                                        }}
                                        onTouchStart={(e) => {
                                            const touch = e.touches[0];
                                            const x = touch.pageX;
                                            const y = touch.pageY;
                                            longPressTimeoutRef.current = setTimeout(() => {
                                                if (selectedMessageIds.length === 0) {
                                                    toggleMessageSelection(item.id);
                                                } else {
                                                    setMessageMenuData({ message: item, x, y });
                                                }
                                            }, 500);
                                        }}
                                        onTouchEnd={() => {
                                            if (longPressTimeoutRef.current) {
                                                clearTimeout(longPressTimeoutRef.current);
                                            }
                                        }}
                                        onTouchMove={() => {
                                            if (longPressTimeoutRef.current) {
                                                clearTimeout(longPressTimeoutRef.current);
                                            }
                                        }}
                                    >
                                        {selectedMessageIds.includes(item.id) && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <div className="bg-indigo-500 text-white rounded-full p-0.5 shadow-lg">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Quoted / Reply Preview inside the bubble */}
                                        {item.replyTo && (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); scrollToMessage(item.replyTo!.id); }}
                                                className={`mb-2 rounded-xl px-3 py-2 text-xs border-l-4 cursor-pointer hover:opacity-80 transition-all ${isOwn
                                                    ? 'bg-indigo-700/60 border-white/60 text-indigo-100'
                                                    : 'bg-slate-50 border-indigo-400 text-slate-600'
                                                    } ${isImage ? 'mx-1 mt-1' : ''}`}
                                            >
                                                <p className={`font-black text-[10px] uppercase tracking-widest mb-0.5 ${isOwn ? 'text-indigo-200' : 'text-indigo-500'}`}>
                                                    {replyOwner}
                                                </p>
                                                <p className="truncate font-medium">
                                                    {item.replyTo.message || (item.replyTo.fileType?.startsWith('image/') ? '📷 Photo' : '📄 File')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Attachment Logic */}
                                        {item.fileUrl && (
                                            <div className="mb-2">
                                                {isImage ? (
                                                    <div className="rounded-xl overflow-hidden shadow-sm border border-black/5 bg-slate-100 min-w-[200px]">
                                                        <img
                                                            src={item.fileUrl}
                                                            alt={item.fileName}
                                                            className="max-h-60 w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                                            onClick={() => window.open(item.fileUrl, '_blank')}
                                                        />
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={item.fileUrl}
                                                        target="_blank"
                                                        className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${isOwn ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-indigo-100'}`}>
                                                            {item.fileName?.endsWith('.pdf') ? <FileText size={24} className={isOwn ? 'text-white' : 'text-indigo-600'} /> : <File size={24} className={isOwn ? 'text-white' : 'text-indigo-600'} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <p className={`text-xs font-bold truncate ${isOwn ? 'text-white' : 'text-slate-800'}`}>{item.fileName}</p>
                                                            <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>Document</p>
                                                        </div>
                                                        <Download size={18} className={isOwn ? 'text-white/60' : 'text-slate-300'} />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {item.message && (
                                            <div className={`text-sm leading-relaxed font-medium ${isImage ? 'px-2 py-1' : ''}`}>
                                                <ExpandableText
                                                    text={item.message}
                                                    limit={500}
                                                    highlight={searchTerm}
                                                    actionClassName={isOwn
                                                        ? "text-white hover:text-indigo-100 underline decoration-white/30"
                                                        : "text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200"
                                                    }
                                                />
                                            </div>
                                        )}

                                        <div className={`mt-1 flex items-center justify-end space-x-1.5 ${isImage ? 'px-2 pb-1' : ''} ${isOwn ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                                            <span className="text-[9px] font-bold">
                                                {item.isSending ? 'Syncing...' : (item.createdAt ? (parseDate(item.createdAt)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '') : '')}
                                            </span>
                                            {isOwn && !item.isSending && (
                                                <div className="flex items-center">
                                                    {item.isRead ? (
                                                        <CheckCheck size={14} strokeWidth={3.5} className="text-[#34B7F1] drop-shadow-sm" />
                                                    ) : (
                                                        <Check size={14} strokeWidth={3} className="text-white/60" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {showTail && (
                                            <div className={`absolute top-0 w-3 h-3 ${isOwn
                                                ? '-right-1.5 bg-indigo-600 [clip-path:polygon(0_0,0_100%,100%_0)]'
                                                : '-left-1.5 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]'
                                                }`}></div>
                                        )}
                                    </div>

                                    {/* Reply button for own messages — on the left side */}
                                    {isOwn && (
                                        <button
                                            onClick={() => { setReplyingTo({ id: item.id, senderId: item.senderId, message: item.message, fileType: item.fileType, fileUrl: item.fileUrl, fileName: item.fileName }); textareaRef.current?.focus(); }}
                                            className="ml-2 p-1.5 rounded-full bg-white/80 border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover/msg:opacity-100 scale-75 group-hover/msg:scale-100 shrink-0 mb-4"
                                        >
                                            <CornerUpLeft size={14} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {isRecipientTyping && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start mt-4 mb-2">
                            <div className="bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-1.5">
                                {[0, 150, 300].map((delay) => (
                                    <span key={delay} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-5 bg-white border-t border-slate-50 relative z-30">
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center space-x-3"
                        >
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Uploading File...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-4xl mx-auto flex flex-col space-y-2">
                    {/* Reply Preview Bar */}
                    <AnimatePresence>
                        {replyingTo && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl mx-1"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-l-4 border-indigo-500 rounded-l-md">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-xs font-black text-indigo-600 mb-0.5 uppercase tracking-wide">
                                            Replying to {Number(replyingTo.senderId) === Number(currentUser.id) ? 'Yourself' : recipient?.name}
                                        </p>
                                        <p className="text-sm text-slate-600 truncate font-medium">
                                            {replyingTo.message || (replyingTo.fileType?.startsWith('image/') ? '📷 Photo' : '📄 File')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full transition-colors self-start"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end space-x-2 md:space-x-4">
                        <div className="flex items-center space-x-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <div className="relative" ref={emojiPickerRef}>
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2 rounded-lg transition-all cursor-pointer ${showEmojiPicker
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-xs'
                                        }`}
                                >
                                    <Smile size={20} strokeWidth={2.5} />
                                </button>

                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden"
                                        >
                                            <EmojiPicker
                                                onEmojiClick={handleEmojiClick}
                                                lazyLoadEmojis={true}
                                                searchPlaceholder="Search emoji..."
                                                skinTonesDisabled
                                                height={380}
                                                width={320}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-xs rounded-lg transition-all cursor-pointer"
                            >
                                <Paperclip size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                placeholder="Type a message..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 pr-12 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-hidden resize-none max-h-32 transition-all custom-scrollbar"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={`p-4 rounded-2xl shadow-xl transition-all transform active:scale-90 shrink-0 flex items-center justify-center group ${inputValue.trim()
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 cursor-pointer'
                                : 'bg-slate-100 text-slate-300'
                                }`}
                        >
                            <Send size={20} strokeWidth={2.5} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5 group-hover:rotate-12 transition-transform" : ""} fill={inputValue.trim() ? "white" : "none"} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {messageMenuData && (
                    <>
                        <div
                            className="fixed inset-0 z-90"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMessageMenuData(null);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMessageMenuData(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="fixed z-100 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-1"
                            style={{
                                left: Math.min(messageMenuData.x, typeof window !== 'undefined' ? window.innerWidth - 180 : messageMenuData.x),
                                top: Math.min(messageMenuData.y, typeof window !== 'undefined' ? window.innerHeight - 200 : messageMenuData.y)
                            }}
                        >
                            <button
                                onClick={() => handleCopyMessage(messageMenuData.message.message)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                            >
                                <Copy size={16} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">Copy</span>
                            </button>
                            <button
                                onClick={() => handleShareMessage(messageMenuData.message)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                            >
                                <Share2 size={16} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">Share</span>
                            </button>
                            {(Number(messageMenuData.message.senderId) === Number(currentUser.id)) && (
                                <button
                                    onClick={() => handleDeleteMessage(messageMenuData.message.id)}
                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group border-t border-slate-50"
                                >
                                    <Trash2 size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold text-red-600">Delete</span>
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
