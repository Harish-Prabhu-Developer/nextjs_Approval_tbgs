"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import { useSocket } from './hooks/useSocket';
import { useAppSelector } from '@/redux/hooks';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
    const { user: currentUser } = useAppSelector((state: any) => state.auth);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    // Stable Refs
    const selectedUserRef = useRef<number | null>(null);
    const socketRef = useRef<any>(null);
    const readInProgressRef = useRef<Set<number>>(new Set());
    const lastFetchTimeRef = useRef<number>(0);
    useEffect(() => {
        selectedUserRef.current = selectedUserId;
    }, [selectedUserId]);

    const { socket, isConnected } = useSocket(currentUser?.id);

    // Debounced stable connection state to prevent rapid flicker
    const [stableConnected, setStableConnected] = useState(false);
    const [showConnected, setShowConnected] = useState(false);
    const connDebounceRef = useRef<any>(null);

    useEffect(() => {
        if (connDebounceRef.current) clearTimeout(connDebounceRef.current);
        if (isConnected) {
            // Show 'Connected' banner immediately when we connect
            connDebounceRef.current = setTimeout(() => {
                setStableConnected(true);
                setShowConnected(true);
                setTimeout(() => setShowConnected(false), 3000);
            }, 300);
        } else {
            // Only show 'Syncing...' after 1.5s of sustained disconnection
            connDebounceRef.current = setTimeout(() => {
                setStableConnected(false);
            }, 1500);
        }
        return () => { if (connDebounceRef.current) clearTimeout(connDebounceRef.current); };
    }, [isConnected]);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    const fetchUsers = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.get(`/api/chat/users?currentUserId=${currentUser.id}&t=${Date.now()}`);
            setUsers(res.data);
            setIsLoading(false);
            lastFetchTimeRef.current = Date.now();
        } catch (err) {
            console.error("Error fetching users:", err);
            setIsLoading(false);
        }
    }, [currentUser?.id]);

    const markAsRead = useCallback(async (senderId: number) => {
        if (!currentUser?.id || readInProgressRef.current.has(senderId)) return;
        try {
            const sId = Number(senderId);
            const rId = Number(currentUser.id);
            readInProgressRef.current.add(sId);

            setUsers(prev => prev.map(u => u.id === sId ? { ...u, unreadCount: 0 } : u));
            setMessages(prev => prev.map(m => (m.senderId === sId && !m.isRead) ? { ...m, isRead: true } : m));

            await axios.post('/api/chat/read', { senderId: sId, receiverId: rId });

            if (socketRef.current) {
                socketRef.current.emit('messages-read', { senderId: sId, receiverId: rId });
            }
        } catch (err) {
            console.error("Error marking messages as read:", err);
        } finally {
            readInProgressRef.current.delete(senderId);
        }
    }, [currentUser?.id]);

    const fetchMessages = useCallback(async (userId2: number) => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.get(`/api/chat/messages?userId1=${currentUser.id}&userId2=${userId2}&t=${Date.now()}`);
            setMessages(res.data);

            const hasUnread = res.data.some((m: any) => !m.isRead && Number(m.senderId) === Number(userId2));
            if (hasUnread) {
                markAsRead(userId2);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    }, [currentUser?.id, markAsRead]);

    useEffect(() => {
        if (currentUser) fetchUsers();
    }, [currentUser, fetchUsers]);

    useEffect(() => {
        if (selectedUserId !== null) {
            setMessages([]);
            setIsTyping(false);
            fetchMessages(selectedUserId);
        }
    }, [selectedUserId, fetchMessages]);

    useEffect(() => {
        if (isConnected && currentUser?.id) {
            fetchUsers();
            if (selectedUserRef.current) fetchMessages(selectedUserRef.current);
        }
    }, [isConnected, currentUser?.id, fetchUsers, fetchMessages]);

    useEffect(() => {
        const handleFocus = () => {
            if (selectedUserRef.current !== null) markAsRead(selectedUserRef.current);
        };
        window.addEventListener('focus', handleFocus);
        
        // Request Notification Permissions
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => window.removeEventListener('focus', handleFocus);
    }, [markAsRead]);

    // Typing Emit Logic - Relaxed connection check
    const handleTyping = useCallback((isTypingStatus: boolean) => {
        if (socketRef.current && selectedUserRef.current !== null) {
            socketRef.current.emit('typing', {
                receiverId: selectedUserRef.current,
                userId: currentUser?.id,
                typing: isTypingStatus
            });
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data: any) => {
            const activeId = selectedUserRef.current;
            const myId = Number(currentUser?.id);
            const dataSId = Number(data.senderId);
            const dataRId = Number(data.receiverId);

            setUsers(prev => {
                const updatedUsers = prev.map(u => {
                    const isRelevantUser = (u.id === dataSId || u.id === dataRId) && u.id !== myId;
                    if (!isRelevantUser) return u;

                    const isCurrentlyChatting = u.id === activeId;
                    const isIncomingMessage = dataSId === u.id;

                    return {
                        ...u,
                        lastMessage: data.message,
                        lastMessageTime: data.createdAt,
                        lastFileUrl: data.fileUrl,
                        lastFileType: data.fileType,
                        isTyping: isIncomingMessage ? false : u.isTyping,
                        unreadCount: (isIncomingMessage && !isCurrentlyChatting)
                            ? (u.unreadCount || 0) + 1
                            : 0
                    };
                });
                return updatedUsers;
            });

            const isForThisChat = (dataRId === myId && dataSId === activeId) || (dataSId === myId && dataRId === activeId);

            if (isForThisChat) {
                setMessages(prev => {
                    const msgId = Number(data.id);
                    const idx = prev.findIndex(m =>
                        (msgId !== 0 && Number(m.id) === msgId) ||
                        (!!data.clientMessageId && m.clientMessageId === data.clientMessageId)
                    );
                    const normalized = {
                        ...data,
                        isRead: (dataRId === myId && dataSId === activeId) ? true : data.isRead
                    };
                    if (idx === -1) return [...prev, normalized];
                    return prev.map((m, i) => i === idx ? { ...m, ...normalized, isSending: false } : m);
                });

                if (dataSId === activeId) {
                    setIsTyping(false);
                    if (dataRId === myId) markAsRead(activeId);
                }
            }
        };

        const handleMessagesRead = ({ senderId, receiverId }: any) => {
            const myId = Number(currentUser?.id);
            const activeId = Number(selectedUserRef.current);
            const sIdNum = Number(senderId);
            const rIdNum = Number(receiverId);

            if ((sIdNum === myId && rIdNum === activeId) || (sIdNum === activeId && rIdNum === myId)) {
                setMessages(prev => prev.map(m => !m.isRead ? { ...m, isRead: true } : m));
            }
            if (rIdNum === myId) {
                setUsers(prev => prev.map(u => u.id === sIdNum ? { ...u, unreadCount: 0 } : u));
            }
        };

        const handleStatusUpdate = ({ userId, isOnline }: any) => {
            const uId = Number(userId);
            setUsers(prev => prev.map(u => u.id === uId ? { ...u, status: { ...u.status, isOnline } } : u));
        };

        const handleTypingEvent = (data: any) => {
            const uId = Number(data.userId);
            const typing = Boolean(data.typing);

            // 1. Update status in the users list (for sidebar dots/indicators)
            setUsers(prev => prev.map(u => u.id === uId ? { ...u, isTyping: typing } : u));

            // 2. Update the active chat window indicator
            if (uId === selectedUserRef.current) {
                setIsTyping(typing);
            }
        };

        const handleMessageDeleted = ({ messageId }: any) => {
            setMessages(prev => prev.filter(m => Number(m.id) !== Number(messageId)));
        };

        socket.on('new-message', handleNewMessage);
        socket.on('on-messages-read', handleMessagesRead);
        socket.on('status-update', handleStatusUpdate);
        socket.on('user-typing', handleTypingEvent);
        socket.on('message-deleted', handleMessageDeleted);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('on-messages-read', handleMessagesRead);
            socket.off('status-update', handleStatusUpdate);
            socket.off('user-typing', handleTypingEvent);
            socket.off('message-deleted', handleMessageDeleted);
            // Clear typing when socket refreshes to avoid stale state
            setIsTyping(false);
        };
    }, [socket, currentUser?.id, markAsRead]);

    const handleSendMessage = async (text: string, fileData?: any) => {
        if (!selectedUserId || !currentUser?.id) return;
        const myId = Number(currentUser.id);
        const contactId = Number(selectedUserId);
        const clientMessageId = `${myId}-${contactId}-${Date.now()}`;

        let localFileUrl = fileData?.fileUrl;
        if (fileData?.fileObject) localFileUrl = URL.createObjectURL(fileData.fileObject);

        const optimisticMsg = {
            id: Date.now(), senderId: myId, receiverId: contactId, message: text,
            fileUrl: localFileUrl, fileName: fileData?.fileName, fileType: fileData?.fileType,
            createdAt: new Date().toISOString(), isSending: true, isRead: false,
            clientMessageId, replyTo: fileData?.replyTo
        };

        setMessages(prev => [...prev, optimisticMsg]);
        handleTyping(false); // Clear typing instantly locally

        try {
            let finalFileData = { ...fileData };
            if (fileData?.fileObject) {
                const formData = new FormData();
                formData.append('file', fileData.fileObject);
                const uploadRes = await axios.post('/api/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                finalFileData = { fileUrl: uploadRes.data.fileUrl, fileName: uploadRes.data.fileName, fileType: uploadRes.data.fileType };
                if (localFileUrl) URL.revokeObjectURL(localFileUrl);
            }

            const res = await axios.post('/api/chat/messages', {
                senderId: myId, receiverId: contactId, message: text,
                fileUrl: finalFileData.fileUrl, fileName: finalFileData.fileName, fileType: finalFileData.fileType,
                replyTo: fileData?.replyTo, clientMessageId
            });

            if (socketRef.current) {
                socketRef.current.emit('send-message', res.data);
            }

            setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...res.data, isSending: false } : m));
            setUsers(prev => prev.map(u => u.id === contactId ? { ...u, lastMessage: text, lastMessageTime: new Date().toISOString(), unreadCount: 0 } : u));
        } catch (err) {
            console.error("Error sending message:", err);
            if (localFileUrl) URL.revokeObjectURL(localFileUrl);
            setMessages(prev => prev.filter(m => m.clientMessageId !== clientMessageId));
        }
    };

    if (!currentUser) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex h-[calc(100vh-160px)] md:h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl shadow-indigo-100/40 overflow-hidden border border-slate-100 relative">
            <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-85 h-full border-r border-slate-100 bg-slate-50/30`}>
                <ChatSidebar users={users} currentUser={currentUser} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} isLoading={isLoading} />
            </div>
            <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 relative flex flex-col h-full overflow-hidden bg-white`}>
                <ChatWindow
                    recipient={users.find(u => u.id === selectedUserId) || null}
                    currentUser={currentUser}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    onClearChat={() => { setMessages([]); fetchUsers(); }}
                    onDeleteMessage={(id) => { setMessages(prev => prev.filter(m => Number(m.id) !== Number(id))); if (socketRef.current) { socketRef.current.emit('delete-message', { messageId: id, receiverId: selectedUserId }); } }}
                    isRecipientTyping={isTyping}
                    isConnected={isConnected}
                    onBack={() => setSelectedUserId(null)}
                />
                <AnimatePresence>
                    {showConnected && stableConnected && (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl z-50 flex items-center space-x-2 border border-emerald-400/30"
                        >
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            <span>Connected</span>
                        </motion.div>
                    )}
                    {!stableConnected && (
                        <motion.div
                            key="syncing"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl z-50 flex items-center space-x-2 border border-amber-400/30"
                        >
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            <span>Syncing...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
