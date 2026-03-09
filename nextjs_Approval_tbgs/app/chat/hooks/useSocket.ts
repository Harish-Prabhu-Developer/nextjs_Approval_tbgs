"use client";
// app/chat/hooks/useSocket.ts
import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Types
interface MessagePayload {
  id: number;
  senderId: number;
  receiverId: number;
  message: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt?: string | Date;
  isRead?: boolean;
}

interface TypingPayload {
  userId: number;
  typing: boolean;
}

interface StatusUpdatePayload {
  userId: number;
  isOnline: boolean;
  timestamp?: string;
}

// Singleton socket instance
let globalSocket: Socket | null = null;
let globalUserId: number | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;

export const useSocket = (userId: number | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const mountedRef = useRef(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(async (uid: number) => {
    if (!mountedRef.current) return;

    try {
      setConnectionError(null);

      // If we already have a socket for this user, reuse it
      if (globalSocket && globalUserId === uid) {
        setSocket(globalSocket);
        setIsConnected(globalSocket.connected);
        
        if (globalSocket.connected) {
          globalSocket.emit("join", { userId: uid });
        } else {
          globalSocket.connect();
        }
        return;
      }

      // Different user - destroy old socket
      if (globalSocket) {
        globalSocket.removeAllListeners();
        globalSocket.disconnect();
        globalSocket = null;
        globalUserId = null;
      }

      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.29.216:3001';
      
      console.log(`Connecting to socket server: ${SOCKET_URL}`);

      // Create new socket instance with optimized settings
      const socketInstance = io(SOCKET_URL, {
        // Always start with polling for reliable handshake
        transports: ["polling", "websocket"],
        // Allow upgrade to websocket
        upgrade: true,
        rememberUpgrade: true,
        
        // Connection settings
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000,
        
        // Additional headers
        extraHeaders: {
          "ngrok-skip-browser-warning": "true",
          "X-Client-Type": "nextjs",
          "X-User-ID": uid.toString()
        },
        
        // Query parameters
        query: {
          userId: uid.toString(),
          client: 'nextjs'
        },
        
        // Auto connect
        autoConnect: true,
        forceNew: false,
        
        // Correct property name is transportOptions (singular)
        transportOptions: {
          polling: {
            extraHeaders: {
              "ngrok-skip-browser-warning": "true"
            }
          }
        }
      });

      // Connection event handlers
      socketInstance.on("connect", () => {
        console.log("Socket connected:", socketInstance.id);
        if (mountedRef.current) {
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts = 0;
          
          // Join user room
          socketInstance.emit("join", { userId: uid });
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (mountedRef.current) {
          setIsConnected(false);
          
          // Handle specific disconnect reasons
          if (reason === "io server disconnect") {
            // Server initiated disconnect, don't reconnect
            console.log("Server disconnected, manual reconnect needed");
          } else if (reason === "transport close") {
            // Transport closed, will auto-reconnect
            console.log("Transport closed, attempting reconnect...");
          }
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        if (mountedRef.current) {
          setConnectionError(error.message);
          setIsConnected(false);
          
          reconnectAttempts++;
          
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Max reconnection attempts reached");
            socketInstance.disconnect();
          }
        }
      });

      socketInstance.on("error", (error) => {
        console.error("Socket error:", error);
        if (mountedRef.current) {
          setConnectionError(error.message || "Unknown error");
        }
      });

      socketInstance.on("reconnect_attempt", (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
      });

      socketInstance.on("reconnect", () => {
        console.log("Socket reconnected");
        if (mountedRef.current) {
          setIsConnected(true);
          setConnectionError(null);
          
          // Re-join user room after reconnect
          socketInstance.emit("join", { userId: uid });
        }
      });

      // Set up ping interval to check connection health
      pingIntervalRef.current = setInterval(() => {
        if (socketInstance.connected && mountedRef.current) {
          const start = Date.now();
          socketInstance.emit("ping", (response: any) => {
            const latency = Date.now() - start;
            if (latency > 1000) {
              console.warn(`High latency detected: ${latency}ms`);
            }
          });
        }
      }, 30000); // Every 30 seconds

      // Store global references
      globalSocket = socketInstance;
      globalUserId = uid;
      setSocket(socketInstance);

    } catch (error) {
      console.error("Socket connection failed:", error);
      if (mountedRef.current) {
        setConnectionError(error instanceof Error ? error.message : "Connection failed");
      }
    }
  }, []);

  // Effect to handle userId changes
  useEffect(() => {
    if (!userId) {
      cleanup();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    mountedRef.current = true;
    
    // Add delay to prevent connection storms during re-renders
    const timer = setTimeout(() => {
      connect(userId);
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
      
      // Don't disconnect global socket here, let it persist for the user
    };
  }, [userId, connect, cleanup]);

  // Utility functions with stability improvements
  const emitWithRetry = useCallback((event: string, data: any, maxRetries = 3) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("Socket not connected"));
        return;
      }

      let attempts = 0;
      
      const attempt = () => {
        socket.emit(event, data, (response: any) => {
          if (response?.error) {
            if (attempts < maxRetries) {
              attempts++;
              setTimeout(attempt, 1000 * attempts);
            } else {
              reject(new Error(response.error));
            }
          } else {
            resolve(response);
          }
        });
      };
      
      attempt();
    });
  }, [socket, isConnected]);

  return { 
    socket, 
    isConnected, 
    connectionError,
    emitWithRetry
  };
};