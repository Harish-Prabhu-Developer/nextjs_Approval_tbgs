"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/redux/hooks";
import { useSocket } from "@/app/chat/hooks/useSocket";
import { toast } from "react-hot-toast";

export default function GlobalNotifications() {
    const { user: currentUser } = useAppSelector((state: any) => state.auth);
    const { socket } = useSocket(currentUser?.id);
    const lastNotificationId = useRef<string | null>(null);

    useEffect(() => {
        // Request Notification Permissions on mount
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Generic Push Notification (Works for Chat, Approvals, etc.)
        const handlePushNotification = (data: any) => {
            const notificationId = data.messageId || data.sno || `${data.title}-${data.body}`;
            if (lastNotificationId.current === notificationId) return;
            lastNotificationId.current = notificationId;

            const isChatPage = window.location.pathname.includes('/chat');
            const isApprovalsPage = window.location.pathname.includes('/approvals');

            // Show Browser Notification if window is in background
            if (!document.hasFocus()) {
                if ("Notification" in window && Notification.permission === "granted") {
                    const n = new Notification(data.title || "Notification", {
                        body: data.body,
                        icon: "/next.svg",
                    });
                    n.onclick = () => {
                        window.focus();
                        if (data.type === 'chat_message') {
                            window.location.href = "/chat";
                        } else if (data.type?.includes('approval')) {
                            window.location.href = "/dashboard";
                        }
                    };
                }
            }

            // Show Toast if on a different page or if it's an important approval
            const isRelevantChat = isChatPage && data.type === 'chat_message';
            const isRelevantApproval = isApprovalsPage && data.type?.includes('approval');

            if (!isRelevantChat && !isRelevantApproval) {
                toast.success(`${data.title}: ${data.body}`, {
                    duration: 5000,
                    position: "top-right",
                    style: {
                        background: data.type?.includes('approval') ? "#059669" : "#4f46e5",
                        color: "#fff",
                        fontWeight: "bold",
                        borderRadius: "12px",
                        padding: "12px 20px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }
                });
            }
        };

        socket.on("new-message", (data) => {
            // Transform legacy chat message to push format for convenience
            handlePushNotification({
                title: data.senderName || "New Message",
                body: data.message || (data.fileUrl ? "📷 Attachment" : "New message"),
                type: 'chat_message',
                ...data
            });
        });

        socket.on("push-notification", handlePushNotification);

        return () => {
            socket.off("new-message");
            socket.off("push-notification", handlePushNotification);
        };
    }, [socket, currentUser?.id]);

    return null; // This component doesn't render anything
}
