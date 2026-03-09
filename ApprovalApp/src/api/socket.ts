// ApprovalApp/src/api/socket.ts
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Types
export interface ChatMessagePayload {
  id: number;
  senderId: number;
  receiverId: number;
  message: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt?: string | Date;
  isRead?: boolean;
  replyTo?: any | null;
}

export interface TypingPayload {
  receiverId: number;
  userId: number;
  typing: boolean;
}

export interface MessagesReadPayload {
  senderId: number;
  receiverId: number;
}

export interface DeleteMessagePayload {
  messageId: number;
  receiverId: number;
  senderId?: number;
}

export interface StatusUpdatePayload {
  userId: number;
  isOnline: boolean;
  timestamp?: string;
}

export interface ServerToClientEvents {
  'new-message': (payload: ChatMessagePayload) => void;
  'user-typing': (payload: { userId: number; typing: boolean; timestamp?: string }) => void;
  'on-messages-read': (payload: MessagesReadPayload & { timestamp?: string }) => void;
  'status-update': (payload: StatusUpdatePayload) => void;
  'message-deleted': (payload: { messageId: number; timestamp?: string }) => void;
  'online-users': (users: number[]) => void;
  'message-delivered': (payload: { messageId: number; receiverId: number; timestamp: string }) => void;
  'error': (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  join: (payload: { userId: number }) => void;
  'send-message': (payload: ChatMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
  'messages-read': (payload: MessagesReadPayload) => void;
  'delete-message': (payload: DeleteMessagePayload) => void;
  ping: (callback: (response: any) => void) => void;
}

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Configuration
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.29.216:3001';
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 2000;

console.log(`Socket: Using standalone server at ${SOCKET_URL}`);

// Singleton instances
let socket: AppSocket | null = null;
let activeUserId: number | null = null;
let networkListener: (() => void) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

// Validation
const isValidUserId = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

// Cleanup function
const cleanup = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (networkListener) {
    networkListener();
    networkListener = null;
  }
};

// Network state monitoring
const setupNetworkListener = (userId: number) => {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && socket && !socket.connected) {
      console.log('Network reconnected, attempting socket reconnect...');
      socket.connect();
    }
  });
};

// Core event listeners
const attachCoreListeners = (instance: AppSocket, userId: number) => {
  instance.on('connect', () => {
    console.log('✅ Socket connected:', instance.id, '| Transport:', instance.io.engine.transport.name);
    activeUserId = userId;
    
    // Join user room
    instance.emit('join', { userId });
    
    // Clear any reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  instance.on('disconnect', (reason) => {
    console.warn('⚡ Socket disconnected:', reason);
    
    // Handle specific disconnect reasons
    if (reason === 'io server disconnect') {
      // Server disconnected, attempt reconnect after delay
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect after server disconnect...');
        instance.connect();
      }, RECONNECT_DELAY);
    }
    // 'transport close' will trigger auto-reconnect
  });

  instance.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    
    // Check if it's a CORS error
    if (error.message.includes('cors')) {
      console.error('CORS error detected - check server configuration');
    }
  });

  instance.on('error', (error) => {
    console.error('Socket error:', error);
  });

  instance.io.on('reconnect_attempt', (attempt) => {
    console.log(`🔄 Reconnection attempt ${attempt}`);
  });

  instance.io.on('reconnect', () => {
    console.log('✅ Socket reconnected');
    // Re-join user room
    if (activeUserId) {
      instance.emit('join', { userId: activeUserId });
    }
  });

  instance.io.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts');
  });

  instance.on('online-users', (users) => {
    console.log('Online users:', users.length);
  });

  instance.on('message-delivered', (payload) => {
    console.log('Message delivered:', payload.messageId);
  });

  instance.on('error', (payload) => {
    console.error('Server error:', payload.message);
  });
};

// Main initialization function
export const initiateSocketConnection = (userId: number): AppSocket => {
  if (!isValidUserId(userId)) {
    throw new Error(`Invalid socket user id: ${String(userId)}`);
  }

  // Clean up any existing reconnect attempts
  cleanup();

  // Reuse existing socket if same user
  if (socket && activeUserId === userId) {
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('join', { userId });
    }
    return socket;
  }

  // Clean up previous socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeUserId = userId;

  // Platform-specific configurations
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  // Create new socket with optimized settings for mobile
  socket = io(SOCKET_URL, {
    // Transport settings - polling first for reliability
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: true,
    
    // Connection settings
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000, // Matched with nextjs setting
    
    // Mobile-specific settings
    forceNew: false,
    multiplex: true,
    
    // Headers
    extraHeaders: {
      "ngrok-skip-browser-warning": "true",
      "X-Client-Type": `expo-${Platform.OS}`,
      "X-Client-Version": Platform.Version.toString(),
      "X-User-ID": userId.toString()
    },
    
    // Query parameters
    query: {
      userId: userId.toString(),
      platform: Platform.OS,
      version: Platform.Version.toString()
    },
    
    // Auto connect
    autoConnect: true,
    
    // Correct property name is transportOptions (singular)
    transportOptions: {
      polling: {
        extraHeaders: {
          "ngrok-skip-browser-warning": "true"
        }
      }
    }
  });

  // Attach event listeners
  attachCoreListeners(socket, userId);

  // Setup network listener for connectivity changes
  networkListener = setupNetworkListener(userId);

  // Setup ping interval for connection health check
  pingInterval = setInterval(() => {
    if (socket?.connected) {
      const start = Date.now();
      socket.emit('ping', (response: any) => {
        const latency = Date.now() - start;
        if (latency > 2000) {
          console.warn(`High latency detected: ${latency}ms`);
        }
      });
    }
  }, 30000); // Every 30 seconds

  return socket;
};

// Disconnect socket
export const disconnectSocket = (): void => {
  cleanup();
  
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  
  activeUserId = null;
  console.log('Socket disconnected and cleared.');
};

// Get socket instance
export const getSocket = (): AppSocket | null => socket;

// Check connection status
export const isSocketConnected = (): boolean => socket?.connected ?? false;

// Get active user ID
export const getActiveUserId = (): number | null => activeUserId;

// Force reconnect
export const reconnectSocket = (userId?: number): void => {
  if (userId) {
    disconnectSocket();
    initiateSocketConnection(userId);
  } else if (activeUserId) {
    disconnectSocket();
    initiateSocketConnection(activeUserId);
  }
};

// Export types
export type { AppSocket };