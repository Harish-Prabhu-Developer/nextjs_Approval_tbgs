import { apiRequest } from './client';

export interface ReplyTo {
  id: number;
  senderId: number;
  message: string;
  fileType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt: string;
  isRead: boolean;
  isSending?: boolean;
  replyTo?: ReplyTo | null;
}

export interface ChatUser {
  id: number;
  name: string;
  username: string;
  email?: string;
  isTyping?: boolean;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastFileUrl?: string | null;
  lastFileType?: string | null;
  unreadCount?: number;
  status?: {
    isOnline: boolean;
    lastSeen: string;
  };
}

export interface CreateChatMessagePayload {
  senderId: number;
  receiverId: number;
  message: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  replyTo?: ReplyTo | null;
}

const apiBaseUrl = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

export const normalizeFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return null;
  if (/^(https?:\/\/|file:\/\/|content:\/\/)/i.test(fileUrl)) {
    return fileUrl;
  }
  if (!apiBaseUrl) {
    return fileUrl;
  }
  return `${apiBaseUrl}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
};

export const normalizeReplyTo = (replyTo?: ReplyTo | null): ReplyTo | null => {
  if (!replyTo) return null;
  return {
    ...replyTo,
    fileUrl: normalizeFileUrl(replyTo.fileUrl),
  };
};

export const normalizeMessage = (message: Message): Message => ({
  ...message,
  imageUrl: normalizeFileUrl(message.imageUrl),
  fileUrl: normalizeFileUrl(message.fileUrl),
  replyTo: normalizeReplyTo(message.replyTo),
});

export const normalizeChatUser = (user: ChatUser): ChatUser => ({
  ...user,
  lastFileUrl: normalizeFileUrl(user.lastFileUrl),
  isTyping: user.isTyping ?? false,
});

export const upsertMessage = (messages: Message[], incomingMessage: Message): Message[] => {
  const normalizedMessage = normalizeMessage(incomingMessage);
  const existingIndex = messages.findIndex(
    (message) => Number(message.id) === Number(normalizedMessage.id)
  );

  if (existingIndex === -1) {
    return [...messages, normalizedMessage];
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...normalizedMessage,
  };
  return nextMessages;
};

export const fetchChatUsersApi = async (
  currentUserId: number,
  token?: string | null
): Promise<ChatUser[]> => {
  const users = await apiRequest<ChatUser[]>(
    `/api/chat/users?currentUserId=${currentUserId}`,
    { token }
  );
  return users.map(normalizeChatUser);
};

export const fetchMessagesApi = async (
  userId1: number,
  userId2: number,
  token?: string | null
): Promise<Message[]> => {
  const messages = await apiRequest<Message[]>(
    `/api/chat/messages?userId1=${userId1}&userId2=${userId2}`,
    { token }
  );
  return messages.map(normalizeMessage);
};

export const createChatMessageApi = async (
  payload: CreateChatMessagePayload,
  token?: string | null
): Promise<Message> => {
  const message = await apiRequest<Message>('/api/chat/messages', {
    method: 'POST',
    body: payload,
    token,
  });
  return normalizeMessage(message);
};

export const deleteChatMessageApi = async (
  messageId: number,
  token?: string | null
): Promise<void> => {
  await apiRequest(`/api/chat/messages/${messageId}`, {
    method: 'DELETE',
    token,
  });
};

export const markMessagesReadApi = async (
  senderId: number,
  receiverId: number,
  token?: string | null
): Promise<void> => {
  await apiRequest('/api/chat/read', {
    method: 'POST',
    body: { senderId, receiverId },
    token,
  });
};
