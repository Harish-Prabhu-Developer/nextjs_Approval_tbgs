"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Smile, MoreHorizontal, Phone, Video, Search, MessageSquare, Check, CheckCheck, ChevronLeft, Download, File, FileText, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessageTime } from '../utils/time';
import axios from 'axios';

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
    onBack?: () => void;
}

export default function ChatWindow({ recipient, currentUser, messages, onSendMessage, onTyping, isRecipientTyping, onBack }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Grouping and Date logic
    const chatContent = useMemo(() => {
        const groups: any[] = [];
        let lastDate = "";

        messages.forEach((msg, idx) => {
            const msgDate = new Date(msg.createdAt).toDateString();

            if (msgDate !== lastDate) {
                const dateLabel = formatMessageTime(msg.createdAt).split(' ')[0];
                groups.push({ type: 'date', label: dateLabel === "Today" || dateLabel === "Yesterday" ? dateLabel : new Date(msg.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) });
                lastDate = msgDate;
            }

            const nextMsg = messages[idx + 1];
            const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(messages[idx - 1].createdAt).getTime() > 300000);
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000);

            groups.push({
                ...msg,
                type: 'message',
                isFirstInGroup,
                isLastInGroup
            });
        });

        return groups;
    }, [messages]);

    const scrollToBottom = (instant = false) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isRecipientTyping]);

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
            if (onTyping) onTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Send message with file data
            onSendMessage('', {
                fileUrl: res.data.fileUrl,
                fileName: res.data.fileName,
                fileType: res.data.fileType
            });
        } catch (err) {
            console.error("Upload failed:", err);
            alert("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        if (onTyping) {
            onTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 2000);
        }
    };

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

            {/* Chat Header */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
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
                                    <p className="text-[10px] md:text-xs font-semibold text-slate-400">
                                        {recipient.status?.isOnline ? 'Available now' : `Last seen ${formatMessageTime(recipient.status?.lastSeen)}`}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 text-slate-400">
                    {[Search, MoreHorizontal].map((Icon, i) => (
                        <button key={i} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer hover:text-indigo-600 active:scale-90">
                            <Icon size={18} strokeWidth={2.5} />
                        </button>
                    ))}
                </div>
            </div>

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

                            const isOwn = item.senderId === currentUser.id;
                            const showTail = item.isFirstInGroup;
                            const isImage = item.fileType?.startsWith('image/');

                            return (
                                <motion.div
                                    key={item.id || `msg-${idx}`}
                                    initial={{ opacity: 0, scale: 0.95, x: isOwn ? 10 : -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    className={`flex w-full mb-1 ${isOwn ? 'justify-end' : 'justify-start'} ${item.isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl shadow-xs relative group ${isOwn
                                        ? `bg-indigo-600 text-white ${showTail ? 'rounded-tr-xs' : 'rounded-tr-2xl'}`
                                        : `bg-white text-slate-800 border border-slate-100 ${showTail ? 'rounded-tl-xs' : 'rounded-tl-2xl'}`
                                        } ${isImage ? 'p-1' : 'px-4 py-2.5'}`}>

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
                                            <p className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${isImage ? 'px-2 py-1' : ''}`}>
                                                {item.message}
                                            </p>
                                        )}

                                        <div className={`mt-1 flex items-center justify-end space-x-1.5 ${isImage ? 'px-2 pb-1' : ''} ${isOwn ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                                            <span className="text-[9px] font-bold">
                                                {item.isSending ? 'Syncing...' : new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                <div className="max-w-4xl mx-auto flex items-end space-x-2 md:space-x-4">
                    <div className="flex items-center space-x-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button className="p-2 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-xs rounded-lg transition-all cursor-pointer">
                            <Smile size={20} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-xs rounded-lg transition-all cursor-pointer"
                        >
                            <Paperclip size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        <textarea
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
    );
}
