"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import { useSocket } from './hooks/useSocket';
import { useAppSelector } from '@/redux/hooks';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function ChatPage() {
    const { user: currentUser } = useAppSelector((state: any) => state.auth);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    // Ref-based ID tracking for socket closure scope
    const selectedUserRef = useRef<number | null>(null);
    useEffect(() => {
        selectedUserRef.current = selectedUserId;
    }, [selectedUserId]);

    const { socket, isConnected } = useSocket(currentUser?.id);

    const fetchUsers = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.get(`/api/chat/users?currentUserId=${currentUser.id}`);
            setUsers(res.data);
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching users:", err);
            setIsLoading(false);
        }
    }, [currentUser?.id]);

    const markAsRead = useCallback(async (senderId: number) => {
        if (!currentUser?.id || !socket) return;
        try {
            const sId = Number(senderId);
            const rId = Number(currentUser.id);

            // 1. Mark in Database
            await axios.post('/api/chat/read', {
                senderId: sId,
                receiverId: rId
            });

            // 2. Immediate Local Sidebar Update
            setUsers(prev => prev.map(u => u.id === sId ? { ...u, unreadCount: 0 } : u));

            // 3. Broadcast to Socket (server handles notifying relevant parties)
            socket.emit('messages-read', {
                senderId: sId,
                receiverId: rId
            });
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    }, [currentUser?.id, socket]);

    const fetchMessages = useCallback(async (userId2: number) => {
        if (!currentUser?.id) return;
        try {
            const res = await axios.get(`/api/chat/messages?userId1=${currentUser.id}&userId2=${userId2}`);
            setMessages(res.data);

            // Initial read mark on open
            markAsRead(userId2);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    }, [currentUser?.id, markAsRead]);

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser, fetchUsers]);

    useEffect(() => {
        if (selectedUserId !== null) {
            setMessages([]);
            fetchMessages(selectedUserId);
        }
    }, [selectedUserId, fetchMessages]);

    // Ensure we mark as read if socket connects AFTER a user was already selected
    useEffect(() => {
        if (isConnected && selectedUserId !== null) {
            markAsRead(selectedUserId);
        }
    }, [isConnected, selectedUserId, markAsRead]);

    // Focus listener fail-safe
    useEffect(() => {
        const handleFocus = () => {
            if (selectedUserRef.current !== null) {
                markAsRead(selectedUserRef.current);
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [markAsRead]);

    useEffect(() => {
        if (!socket) return;

        socket.on('new-message', (data) => {
            console.log("Socket: new-message received", data);
            const activeId = selectedUserRef.current;
            const myId = Number(currentUser?.id);
            const dataSId = Number(data.senderId);
            const dataRId = Number(data.receiverId);

            // 1. Update User List (Snippets and Unread Counts)
            setUsers(prev => prev.map(u => {
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
                    unreadCount: (isIncomingMessage && !isCurrentlyChatting)
                        ? (u.unreadCount || 0) + 1
                        : 0
                };
            }));

            // 2. Update Chat Window (Messages)
            const isForThisChat = (dataRId === myId && dataSId === activeId) || (dataSId === myId && dataRId === activeId);
            if (isForThisChat) {
                setMessages(prev => {
                    const msgId = Number(data.id);
                    if (prev.find(m => Number(m.id) === msgId)) return prev;
                    // If I am the receiver and I'm looking at the chat, mark it as read locally immediately
                    const finalMsg = (dataRId === myId) ? { ...data, isRead: true } : data;
                    return [...prev, finalMsg];
                });

                // 3. Trigger markAsRead if I just received a message while active
                if (dataRId === myId && activeId !== null) {
                    markAsRead(activeId);
                }
            }
        });

        socket.on('on-messages-read', ({ senderId, receiverId }) => {
            console.log("Socket: on-messages-read received", { senderId, receiverId });
            const myId = Number(currentUser?.id);
            const activeId = Number(selectedUserRef.current);
            const sId = Number(senderId); // The person whose messages were read
            const rId = Number(receiverId); // The person who read them

            // 1. Sync messages in the chat window
            // If the chat currently open is the one that was just read (by either person)
            const isThisConversation = (sId === myId && rId === activeId) || (sId === activeId && rId === myId);
            if (isThisConversation) {
                setMessages(prev => {
                    const needsUpdate = prev.some(m => !m.isRead);
                    if (!needsUpdate) return prev;
                    return prev.map(m => !m.isRead ? { ...m, isRead: true } : m);
                });
            }

            // 2. Clear unread count in the sidebar for the reader
            if (rId === myId) {
                setUsers(prev => prev.map(u => u.id === sId ? { ...u, unreadCount: 0 } : u));
            }
        });

        socket.on('status-update', ({ userId, isOnline }) => {
            const uId = Number(userId);
            setUsers(prev => prev.map(u =>
                u.id === uId ? { ...u, status: { ...u.status, isOnline } } : u
            ));
        });

        socket.on('user-typing', ({ userId, typing }) => {
            const uId = Number(userId);
            setUsers(prev => prev.map(u => u.id === uId ? { ...u, isTyping: typing } : u));
            if (uId === selectedUserRef.current) {
                setIsTyping(typing);
            }
        });

        return () => {
            socket.off('new-message');
            socket.off('on-messages-read');
            socket.off('status-update');
            socket.off('user-typing');
        };
    }, [socket, currentUser?.id, markAsRead]);

    const handleSendMessage = async (text: string, fileData?: any) => {
        if (!selectedUserId || !currentUser?.id) return;

        const myId = Number(currentUser.id);
        const contactId = Number(selectedUserId);
        const tempId = Date.now();

        // Handle File Upload Optimistically
        let localFileUrl = fileData?.fileUrl;
        if (fileData?.fileObject) {
            localFileUrl = URL.createObjectURL(fileData.fileObject);
        }

        const optimisticMsg = {
            id: tempId,
            senderId: myId,
            receiverId: contactId,
            message: text,
            fileUrl: localFileUrl,
            fileName: fileData?.fileName,
            fileType: fileData?.fileType,
            createdAt: new Date(), // Using Date object for local consistency
            isSending: true,
            isRead: false
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            let finalFileData = { ...fileData };

            // 1. Perform Upload if there's a file
            if (fileData?.fileObject) {
                const formData = new FormData();
                formData.append('file', fileData.fileObject);
                const uploadRes = await axios.post('/api/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalFileData = {
                    fileUrl: uploadRes.data.fileUrl,
                    fileName: uploadRes.data.fileName,
                    fileType: uploadRes.data.fileType
                };
            }

            // 2. Persist Message
            const res = await axios.post('/api/chat/messages', {
                senderId: myId,
                receiverId: contactId,
                message: text,
                fileUrl: finalFileData.fileUrl,
                fileName: finalFileData.fileName,
                fileType: finalFileData.fileType
            });

            // 3. Clean up the local blob URL if we created one
            if (fileData?.fileObject && localFileUrl) {
                URL.revokeObjectURL(localFileUrl);
            }

            if (socket) {
                socket.emit('send-message', res.data);
            }

            setMessages(prev => prev.map(m => {
                if (m.id === tempId) {
                    return { ...res.data, isRead: m.isRead || res.data.isRead };
                }
                return m;
            }));

            setUsers(prev => prev.map(u =>
                u.id === contactId ? {
                    ...u,
                    lastMessage: text,
                    lastMessageTime: new Date(),
                    lastFileUrl: finalFileData.fileUrl,
                    lastFileType: finalFileData.fileType
                } : u
            ));
        } catch (err) {
            console.error("Error sending message:", err);
            // If upload fails and we had a local URL, clean it up
            if (fileData?.fileObject && localFileUrl) {
                URL.revokeObjectURL(localFileUrl);
            }
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleTyping = (isTypingStatus: boolean) => {
        if (socket && selectedUserId !== null) {
            socket.emit('typing', {
                receiverId: selectedUserId,
                userId: currentUser.id,
                typing: isTypingStatus
            });
        }
    };

    if (!currentUser) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-[calc(100vh-160px)] md:h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl shadow-indigo-100/40 overflow-hidden border border-slate-100 relative"
        >
            <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full border-r border-slate-100`}>
                <ChatSidebar
                    users={users}
                    currentUser={currentUser}
                    selectedUserId={selectedUserId}
                    onSelectUser={setSelectedUserId}
                    isLoading={isLoading}
                />
            </div>

            <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 relative flex flex-col h-full overflow-hidden bg-white`}>
                <ChatWindow
                    recipient={users.find(u => u.id === selectedUserId) || null}
                    currentUser={currentUser}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    onClearChat={() => {
                        setMessages([]);
                        setUsers(prev => prev.map(u =>
                            u.id === selectedUserId ? { ...u, lastMessage: null, lastMessageTime: null } : u
                        ));
                    }}
                    isRecipientTyping={isTyping}
                    onBack={() => setSelectedUserId(null)}
                />

                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-500 z-50 ${isConnected
                    ? 'bg-emerald-100/50 text-emerald-600 backdrop-blur-xs opacity-0 hover:opacity-100 shadow-sm'
                    : 'bg-red-100 text-red-600 shadow-lg'
                    }`}>
                    {isConnected ? '• Real-time Active' : '⚠ Syncing...'}
                </div>
            </div>
        </motion.div>
    );
}
