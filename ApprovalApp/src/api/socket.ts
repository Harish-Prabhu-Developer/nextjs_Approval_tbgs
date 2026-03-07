import { io, Socket } from 'socket.io-client';

interface ReplyToPayload {
  id: number;
  senderId: number;
  message: string;
  fileType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}

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
  replyTo?: ReplyToPayload | null;
}

export interface JoinPayload {
  userId: number;
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
}

export interface MessageDeletedPayload {
  messageId: number;
}

export interface ServerToClientEvents {
  'new-message': (payload: ChatMessagePayload) => void;
  'user-typing': (payload: Pick<TypingPayload, 'userId' | 'typing'>) => void;
  'on-messages-read': (payload: MessagesReadPayload) => void;
  'status-update': (payload: StatusUpdatePayload) => void;
  'message-deleted': (payload: MessageDeletedPayload) => void;
}

export interface ClientToServerEvents {
  join: (payload: number | JoinPayload) => void;
  'send-message': (payload: ChatMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
  'messages-read': (payload: MessagesReadPayload) => void;
  'delete-message': (payload: DeleteMessagePayload) => void;
}

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const rawUrl = process.env.EXPO_PUBLIC_BASE_URL || 'http://192.168.1.13:3001';
const socketUrl = rawUrl.replace(/\/+$/, '');

let socket: AppSocket | null = null;
let activeUserId: number | null = null;

const isValidUserId = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) > 0;

const attachCoreListeners = (instance: AppSocket, userId: number) => {
  instance.on('connect', () => {
    activeUserId = userId;
    instance.emit('join', { userId });
    console.log('Socket connected:', instance.id, 'transport:', instance.io.engine.transport.name);
  });

  instance.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  instance.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });
};

export const initiateSocketConnection = (userId: number): AppSocket => {
  if (!isValidUserId(userId)) {
    throw new Error(`Invalid socket user id: ${String(userId)}`);
  }

  if (socket && activeUserId === userId) {
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('join', { userId });
    }

    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeUserId = userId;
  socket = io(socketUrl, {
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['polling'],
    upgrade: false,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
    forceNew: false,
  });

  attachCoreListeners(socket, userId);

  return socket;
};

export const disconnectSocket = (): void => {
  if (!socket) {
    activeUserId = null;
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  activeUserId = null;
  console.log('Socket disconnected and cleared.');
};

export const getSocket = (): AppSocket | null => socket;

export const isSocketConnected = (): boolean => socket?.connected ?? false;

export type { AppSocket };
