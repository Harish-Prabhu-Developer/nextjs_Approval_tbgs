"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (userId: number | undefined) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Initialize socket connection
        const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL || "", {
            path: "/api/socket",
            addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected");
            setIsConnected(true);
            socketInstance.emit("join", userId);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [userId]);

    return { socket, isConnected };
};
