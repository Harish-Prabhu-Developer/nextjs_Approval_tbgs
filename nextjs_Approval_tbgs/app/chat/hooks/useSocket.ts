"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Global cache to persist socket across Next.js Fast Refresh/HMR
const socketCache: Record<string, any> = {};

export const useSocket = (userId: number | undefined) => {
    const [socket, setSocket] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!userId) {
            setSocket(null);
            setIsConnected(false);
            return;
        }

        mountedRef.current = true;
        const cacheKey = `user-${userId}`;
        let socketInstance: any;

        const connect = async () => {
            // Ensure server is initialized
            await fetch("/api/socket").catch(() => {});

            if (!mountedRef.current) return;

            if (socketCache[cacheKey]) {
                socketInstance = socketCache[cacheKey];
            } else {
                console.log("Socket: Creating new connection for", userId);
                socketInstance = io({
                    path: "/api/socket",
                    addTrailingSlash: false,
                    transports: ["websocket", "polling"],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: Infinity,
                    timeout: 45000,
                    autoConnect: true, // Force auto-connect for immediate start
                });
                socketCache[cacheKey] = socketInstance;
            }

            const onConnect = () => {
                console.log("Socket: Connected", socketInstance.id);
                if (mountedRef.current) setIsConnected(true);
                socketInstance.emit("join", { userId });
            };

            const onDisconnect = () => {
                console.log("Socket: Disconnected");
                if (mountedRef.current) setIsConnected(false);
            };

            const onConnectError = (err: any) => {
                console.warn("Socket: Connection Error", err.message);
                if (mountedRef.current) setIsConnected(false);
            };

            // Remove old listeners to prevent duplicate emitters
            socketInstance.off("connect", onConnect);
            socketInstance.off("disconnect", onDisconnect);
            socketInstance.off("connect_error", onConnectError);

            // Re-attach
            socketInstance.on("connect", onConnect);
            socketInstance.on("disconnect", onDisconnect);
            socketInstance.on("connect_error", onConnectError);

            // Initial manual trigger for state sync
            setSocket(socketInstance);
            setIsConnected(socketInstance.connected);

            if (!socketInstance.connected) {
                socketInstance.connect();
            } else {
                // If already connected, ensure we are in our room
                socketInstance.emit("join", { userId });
            }
        };

        void connect();

        return () => {
            mountedRef.current = false;
        };
    }, [userId]);

    return { socket, isConnected };
};
