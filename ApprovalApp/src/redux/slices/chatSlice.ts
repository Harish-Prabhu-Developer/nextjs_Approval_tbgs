import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/client";

export interface ReplyTo {
  id: number;
  senderId: number;
  message: string;
  fileType?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  isRead: boolean;
  isSending?: boolean;
  replyTo?: ReplyTo | null;
}

export interface ChatUser {
  id: number;
  name: string;
  username: string;
  isTyping?: boolean;
  lastFileUrl?: string | null;
  lastFileType?: string | null;
  status?: {
    isOnline: boolean;
    lastSeen: string;
  };
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount?: number;
}

interface ChatState {
  users: ChatUser[];
  messages: Message[];
  selectedUserId: number | null;
  selectedMessageIds: number[];
  loading: boolean;
  error: string | null;
  isTyping: boolean;
  isUploading: boolean;
  isConnected: boolean;
}

const apiBaseUrl = (process.env.EXPO_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

const normalizeFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return null;
  if (/^(https?:\/\/|file:\/\/|content:\/\/)/i.test(fileUrl)) {
    return fileUrl;
  }
  if (!apiBaseUrl) {
    return fileUrl;
  }
  return `${apiBaseUrl}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

const normalizeMessage = (message: Message): Message => ({
  ...message,
  fileUrl: normalizeFileUrl(message.fileUrl) ?? undefined,
  replyTo: message.replyTo
    ? {
        ...message.replyTo,
        fileUrl: normalizeFileUrl(message.replyTo.fileUrl) ?? undefined,
      }
    : null,
});

const normalizeUser = (user: ChatUser): ChatUser => ({
  ...user,
  lastFileUrl: normalizeFileUrl(user.lastFileUrl),
});

const findMessageIndex = (messages: Message[], messageId: number) =>
  messages.findIndex((message) => Number(message.id) === Number(messageId));

const upsertMessage = (messages: Message[], incomingMessage: Message): Message[] => {
  const normalizedMessage = normalizeMessage(incomingMessage);
  const existingIndex = findMessageIndex(messages, normalizedMessage.id);
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

const initialState: ChatState = {
  users: [],
  messages: [],
  selectedUserId: null,
  selectedMessageIds: [],
  loading: false,
  error: null,
  isTyping: false,
  isUploading: false,
  isConnected: false,
};

export const fetchChatUsers = createAsyncThunk(
  "chat/fetchUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const currentUser = state.auth.user;
      if (!currentUser) return rejectWithValue("Not authenticated");
      
      const users = await apiRequest<ChatUser[]>(`/api/chat/users?currentUserId=${currentUser.id}`, { token });
      return users.map(normalizeUser);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch users");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ userId1, userId2 }: { userId1: number; userId2: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const messages = await apiRequest<Message[]>(`/api/chat/messages?userId1=${userId1}&userId2=${userId2}`, { token });
      return messages.map(normalizeMessage);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch messages");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (payload: any, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const message = await apiRequest<Message>("/api/chat/messages", {
        method: "POST",
        body: payload,
        token,
      });
      return normalizeMessage(message);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to send message");
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      await apiRequest(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
        token,
      });
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to delete message");
    }
  }
);

export const clearChat = createAsyncThunk(
  "chat/clearChat",
  async ({ userId1, userId2 }: { userId1: number; userId2: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      await apiRequest(`/api/chat/clear?userId1=${userId1}&userId2=${userId2}`, {
        method: "DELETE",
        token,
      });
      return { userId1, userId2 };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to clear chat");
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "chat/markAsRead",
  async (senderId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentUser = state.auth.user;
      const token = state.auth.token;
      if (!currentUser) return;

      await apiRequest("/api/chat/read", {
        method: "POST",
        body: { senderId: Number(senderId), receiverId: currentUser.id },
        token,
      });
      return senderId;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to mark as read");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedUserId: (state, action: PayloadAction<number | null>) => {
      state.selectedUserId = action.payload;
      state.messages = [];
    },
    toggleMessageSelection: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.selectedMessageIds.includes(id)) {
        state.selectedMessageIds = state.selectedMessageIds.filter(mid => mid !== id);
      } else {
        state.selectedMessageIds.push(id);
      }
    },
    clearSelection: (state) => {
      state.selectedMessageIds = [];
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages = upsertMessage(state.messages, action.payload);
      // Update last message for the user
      const userIdx = state.users.findIndex(u => 
        (u.id === action.payload.senderId || u.id === action.payload.receiverId) && u.id !== action.payload.senderId // This logic depends on who the other person is
      );
      // Simplified: just add it. Real UI might need better logic here.
    },
    removeMessage: (state, action: PayloadAction<number>) => {
      state.messages = state.messages.filter(m => m.id !== action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setUserTyping: (state, action: PayloadAction<{ userId: number; typing: boolean }>) => {
      const userIdx = state.users.findIndex(u => Number(u.id) === Number(action.payload.userId));
      if (userIdx !== -1) {
        state.users[userIdx] = {
          ...state.users[userIdx],
          isTyping: action.payload.typing,
        };
      }

      state.isTyping = action.payload.typing;
    },
    setUserStatus: (state, action: PayloadAction<{ userId: number; isOnline: boolean }>) => {
      const userIdx = state.users.findIndex(u => Number(u.id) === Number(action.payload.userId));
      if (userIdx !== -1) {
        state.users[userIdx] = {
          ...state.users[userIdx],
          status: {
            isOnline: action.payload.isOnline,
            lastSeen: state.users[userIdx].status?.lastSeen ?? new Date().toISOString(),
          },
        };
      }
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    optimisticAddMessage: (state, action: PayloadAction<Message>) => {
      state.messages = upsertMessage(state.messages, action.payload);
    },
    replaceOptimisticMessage: (state, action: PayloadAction<{ tempId: number; message: Message }>) => {
      const filteredMessages = state.messages.filter(
        message => Number(message.id) !== Number(action.payload.tempId)
      );
      state.messages = upsertMessage(filteredMessages, action.payload.message);
    },
    markAsReadLocally: (state, action: PayloadAction<number>) => {
      // Mark all messages from senderId as read
      state.messages = state.messages.map(m =>
        m.senderId === action.payload ? { ...m, isRead: true } : m
      );
      // Clear unread count for that user
      const userIdx = state.users.findIndex(u => u.id === action.payload);
      if (userIdx !== -1) {
        state.users[userIdx] = { ...state.users[userIdx], unreadCount: 0 };
      }
    },
    updateUserLastMessage: (state, action: PayloadAction<{ userId: number; message: string; fileUrl?: string; fileType?: string }>) => {
      const userIdx = state.users.findIndex(u => u.id === action.payload.userId);
      if (userIdx !== -1) {
        state.users[userIdx] = {
          ...state.users[userIdx],
          isTyping: false,
          lastMessage: action.payload.message,
          lastFileUrl: normalizeFileUrl(action.payload.fileUrl),
          lastFileType: action.payload.fileType ?? null,
          lastMessageTime: new Date().toISOString(),
        };
      }
    },
    resetChat: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatUsers.fulfilled, (state, action) => {
        state.users = action.payload.map(user => {
          const existingUser = state.users.find(existing => Number(existing.id) === Number(user.id));
          return normalizeUser({
            ...user,
            isTyping: existingUser?.isTyping ?? false,
          });
        });
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(m => m.id !== action.payload);
      });
  },
});

export const {
  setSelectedUserId,
  toggleMessageSelection,
  clearSelection,
  addMessage,
  removeMessage,
  setTyping,
  setUserTyping,
  setUserStatus,
  setUploading,
  setConnected,
  optimisticAddMessage,
  replaceOptimisticMessage,
  markAsReadLocally,
  updateUserLastMessage,
  resetChat
} = chatSlice.actions;

export default chatSlice.reducer;
