import { Server as HttpServer } from 'http';
import { NextApiResponse } from 'next';
import { Socket as NetSocket } from 'net';
import { Server as IOServer, Socket as IOSocket } from 'socket.io';

export interface ReplyToPayload {
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
  clientMessageId?: string | null;
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

export interface InterServerEvents {}

export interface SocketData {
  userId?: number;
  typingTimers: Map<number, NodeJS.Timeout>;
}

export type TypedIOServer = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = IOSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: HttpServer & {
      io?: TypedIOServer;
    };
  };
};
