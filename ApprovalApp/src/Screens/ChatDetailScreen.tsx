import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Clipboard,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import EmojiKeyboard from 'rn-emoji-keyboard';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  CornerUpLeft,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAppSelector } from '../redux/hooks';
import { fileUpload } from '../api/client';
import { getSocket, initiateSocketConnection } from '../api/socket';
import {
  ChatUser,
  Message,
  ReplyTo,
  createChatMessageApi,
  deleteChatMessageApi,
  fetchChatUsersApi,
  fetchMessagesApi,
  markMessagesReadApi,
  normalizeMessage,
  upsertMessage,
} from '../api/chat';
import { formatMessageTime } from '../utils/time';

type PendingFile = { uri: string; name: string; type: string };
type ChatRow = { type: 'date'; id: string; label: string } | (Message & { type: 'message' });

const replaceTempMessage = (messages: Message[], tempId: number, nextMessage: Message) =>
  upsertMessage(
    messages.filter((message) => Number(message.id) !== Number(tempId)),
    nextMessage
  );

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center justify-center gap-1 ml-5 w-16 h-10 px-4 bg-white elevation-lg rounded-xl shadow-sm">
      <Animated.View
        style={{ opacity: dot1, transform: [{ scale: dot1 }] }}
        className="w-2 h-2 bg-indigo-500 rounded-full"
      />
      <Animated.View
        style={{ opacity: dot2, transform: [{ scale: dot2 }] }}
        className="w-2 h-2 bg-indigo-500 rounded-full"
      />
      <Animated.View
        style={{ opacity: dot3, transform: [{ scale: dot3 }] }}
        className="w-2 h-2 bg-indigo-500 rounded-full"
      />
    </View>
  );
};

const MobileExpandableText = ({
  text,
  limit = 200,
  isOwn,
  highlight = ""
}: {
  text: string;
  limit?: number;
  isOwn: boolean;
  highlight?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const safeText = (text || "").toString().trim();

  if (!safeText) return null;

  const isLongText = safeText.length > limit;

  const renderFormattedText = (content: string) => {
    const escapedHighlight = highlight.trim() ? highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : "";
    // Match **bold**, *bold*, \n, and highlight
    const regex = new RegExp(`(\\*\\*.*?\\*\\*|\\*.*?\\*|\\n${escapedHighlight ? `|${escapedHighlight}` : ""})`, "gi");
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;
      if (part === '\n') return <Text key={index}>{'\n'}</Text>;

      // WhatsApp style *bold* or markdown **bold**
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
        const isDouble = part.startsWith('**');
        const content = isDouble ? part.slice(2, -2) : part.slice(1, -1);
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>{content}</Text>
        );
      }

      if (escapedHighlight && part.toLowerCase() === highlight.toLowerCase()) {
        return (
          <Text key={index} style={{ backgroundColor: '#fef08a', color: '#0f172a' }}>{part}</Text>
        );
      }

      return <Text key={index}>{part}</Text>;
    });
  };

  const displayText = isExpanded ? safeText : isLongText ? safeText.slice(0, limit) : safeText;

  return (
    <Text className={`text-sm leading-relaxed ${isOwn ? 'text-white' : 'text-slate-800'}`}>
      {renderFormattedText(displayText)}
      {isLongText && (
        <Text
          onPress={() => setIsExpanded(!isExpanded)}
          className={`font-black ml-1 ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}
          style={{ textDecorationLine: 'underline' }}
        >
          {isExpanded ? " Read less" : "... Read more"}
        </Text>
      )}
    </Text>
  );
};

export default function ChatDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { userId, name } = route.params;
  const recipientId = Number(userId);
  const { user: currentUser, token } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const [recipient, setRecipient] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const listRef = useRef<FlatList<ChatRow>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBackPress = useCallback(() => {
    navigation.navigate('ChatList');
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  const loadConversation = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [users, nextMessages] = await Promise.all([
        fetchChatUsersApi(Number(currentUser?.id), token),
        fetchMessagesApi(Number(currentUser?.id), recipientId, token),
      ]);
      setRecipient(users.find((entry) => Number(entry.id) === recipientId) || null);
      setMessages(nextMessages);
      await markMessagesReadApi(recipientId, Number(currentUser?.id), token);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('messages-read', {
          senderId: recipientId,
          receiverId: Number(currentUser?.id),
        });
      }
    } catch (error) {
      console.error('Failed to load chat conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, recipientId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadConversation();
      return () => {
        setSelectedMessageIds([]);
        setIsRecipientTyping(false);
      };
    }, [loadConversation])
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const emitTyping = useCallback(
    (typing: boolean) => {
      if (!currentUser?.id) return;
      const socket = getSocket();
      if (!socket?.connected) return;
      socket.emit('typing', {
        receiverId: recipientId,
        userId: Number(currentUser?.id),
        typing,
      });
    },
    [currentUser?.id, recipientId]
  );

  useEffect(() => {
    if (!currentUser?.id) return;
    const socket = initiateSocketConnection(Number(currentUser.id));
    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join', { userId: Number(currentUser?.id) });
      socket.emit('messages-read', {
        senderId: recipientId,
        receiverId: Number(currentUser?.id),
      });
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleNewMessage = (payload: any) => {
      const message = normalizeMessage({
        ...payload,
        message: payload.message || '',
        createdAt: payload.createdAt?.toString() || new Date().toISOString(),
        isRead: !!payload.isRead
      });
      const myId = Number(currentUser.id);
      const isForChat =
        (Number(message.senderId) === recipientId && Number(message.receiverId) === myId) ||
        (Number(message.senderId) === myId && Number(message.receiverId) === recipientId);
      if (!isForChat) return;

      setMessages((currentMessages) => upsertMessage(currentMessages, message));

      if (Number(message.senderId) === recipientId) {
        setIsRecipientTyping(false);
        void markMessagesReadApi(recipientId, myId, token);
        socket.emit('messages-read', { senderId: recipientId, receiverId: myId });
      }

      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleMessagesRead = ({ senderId, receiverId }: { senderId: number; receiverId: number }) => {
      const myId = Number(currentUser?.id);
      const isRelevant =
        (Number(senderId) === myId && Number(receiverId) === recipientId) || // I am sender, they read
        (Number(receiverId) === myId && Number(senderId) === recipientId);    // They are sender, I read

      if (!isRelevant) return;

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          const isFromSenderToReceiver =
            Number(message.senderId) === Number(senderId) &&
            Number(message.receiverId) === Number(receiverId);

          return isFromSenderToReceiver ? { ...message, isRead: true } : message;
        })
      );
    };

    const handleTyping = ({ userId: typingUserId, typing }: { userId: number; typing: boolean }) => {
      if (Number(typingUserId) === recipientId) {
        setIsRecipientTyping(typing);
      }
    };

    const handleStatus = ({ userId: statusUserId, isOnline }: { userId: number; isOnline: boolean }) => {
      if (Number(statusUserId) !== recipientId) return;
      setRecipient((currentRecipient) =>
        currentRecipient
          ? {
            ...currentRecipient,
            status: {
              isOnline,
              lastSeen: currentRecipient.status?.lastSeen || new Date().toISOString(),
            },
          }
          : currentRecipient
      );
    };

    const handleDelete = ({ messageId }: { messageId: number }) => {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => Number(message.id) !== Number(messageId))
      );
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-message', handleNewMessage);
    socket.on('on-messages-read', handleMessagesRead);
    socket.on('user-typing', handleTyping);
    socket.on('status-update', handleStatus);
    socket.on('message-deleted', handleDelete);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-message', handleNewMessage);
      socket.off('on-messages-read', handleMessagesRead);
      socket.off('user-typing', handleTyping);
      socket.off('status-update', handleStatus);
      socket.off('message-deleted', handleDelete);
      emitTyping(false);
    };
  }, [currentUser?.id, emitTyping, recipientId, token]);

  const groupedMessages = useMemo<ChatRow[]>(() => {
    const filteredMessages = searchTerm
      ? messages.filter((message) =>
        message.message?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      : messages;

    const rows: ChatRow[] = [];
    let lastDate = '';
    filteredMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== lastDate) {
        const now = new Date();
        const date = new Date(message.createdAt);
        let label = 'Today';
        if (messageDate !== now.toDateString()) {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          label =
            messageDate === yesterday.toDateString()
              ? 'Yesterday'
              : date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
        }
        rows.push({ type: 'date', id: `date-${message.createdAt}`, label });
        lastDate = messageDate;
      }
      rows.push({ ...message, type: 'message' });
    });
    return rows;
  }, [messages, searchTerm]);

  const scrollToMessage = useCallback(
    (messageId: number) => {
      const index = groupedMessages.findIndex(
        (row) => row.type === 'message' && Number(row.id) === Number(messageId)
      );
      if (index === -1) {
        Alert.alert('Message not found', 'The original replied message is not available.');
        return;
      }
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setHighlightedMessageId(messageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 2000);
    },
    [groupedMessages]
  );

  const handleSend = async () => {
    if (!currentUser?.id) return;
    if ((!inputValue.trim() && !pendingFile) || isSending) return;

    const replyTo = replyingTo
      ? { ...replyingTo }
      : null;
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      senderId: Number(currentUser?.id),
      receiverId: recipientId,
      message: inputValue.trim(),
      fileUrl: pendingFile?.uri,
      fileName: pendingFile?.name,
      fileType: pendingFile?.type,
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true,
      replyTo,
    };

    setMessages((currentMessages) => upsertMessage(currentMessages, optimisticMessage));
    setInputValue('');
    setReplyingTo(null);
    const fileToUpload = pendingFile;
    setPendingFile(null);
    setIsSending(true);
    setIsUploading(Boolean(fileToUpload));
    emitTyping(false);

    try {
      let uploaded = { fileUrl: null as string | null, fileName: null as string | null, fileType: null as string | null };
      if (fileToUpload?.uri) {
        const formData = new FormData();
        formData.append('file', {
          uri: fileToUpload.uri,
          name: fileToUpload.name,
          type: fileToUpload.type,
        } as any);
        uploaded = await fileUpload('/api/chat/upload', formData, token);
      }

      const persistedMessage = await createChatMessageApi(
        {
          senderId: Number(currentUser?.id),
          receiverId: recipientId,
          message: optimisticMessage.message,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          replyTo,
        },
        token
      );

      setMessages((currentMessages) =>
        replaceTempMessage(currentMessages, tempId, persistedMessage)
      );
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('send-message', persistedMessage);
      }
    } catch (error: any) {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => Number(message.id) !== tempId)
      );
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (!text.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
      return;
    }
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleBulkDelete = async () => {
    const socket = getSocket();
    for (const id of selectedMessageIds) {
      await deleteChatMessageApi(id, token);
      setMessages((currentMessages) =>
        currentMessages.filter((message) => Number(message.id) !== Number(id))
      );
      socket?.emit('delete-message', {
        messageId: id,
        receiverId: recipientId,
        senderId: Number(currentUser?.id),
      });
    }
    setSelectedMessageIds([]);
  };

  const renderMessage = ({ item }: { item: ChatRow }) => {
    if (item.type === 'date') {
      return (
        <View className="flex-row justify-center my-4">
          <View className="px-4 py-1 rounded-full bg-slate-100">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {item.label}
            </Text>
          </View>
        </View>
      );
    }

    const isOwn = !!currentUser && Number(item.senderId) === Number(currentUser.id);
    const isSelected = selectedMessageIds.includes(Number(item.id));
    const isImage = item.fileType?.startsWith('image/');
    const replyOwner = (item.replyTo && !!currentUser && Number(item.replyTo.senderId) === Number(currentUser.id)) ? 'You' : name;

    return (
      <Pressable
        onLongPress={() =>
          setSelectedMessageIds((currentIds) =>
            currentIds.includes(Number(item.id))
              ? currentIds.filter((id) => id !== Number(item.id))
              : [...currentIds, Number(item.id)]
          )
        }
        onPress={() => {
          if (selectedMessageIds.length > 0) {
            setSelectedMessageIds((currentIds) =>
              currentIds.includes(Number(item.id))
                ? currentIds.filter((id) => id !== Number(item.id))
                : [...currentIds, Number(item.id)]
            );
          }
        }}
        className={`px-4 py-1 ${isOwn ? 'items-end' : 'items-start'} ${isSelected ? 'bg-indigo-50/50' : ''
          }`}
      >
        <View
          className={`max-w-[85%] rounded-2xl ${isOwn ? 'bg-indigo-600' : 'bg-white border border-slate-100'} ${isImage ? 'p-1' : 'p-3'
            }`}
          style={
            highlightedMessageId === Number(item.id)
              ? { borderWidth: 2, borderColor: '#f59e0b' }
              : undefined
          }
        >
          {item.replyTo && (
            <Pressable
              onPress={() => scrollToMessage(Number(item.replyTo?.id))}
              className={`mb-2 rounded-xl p-2 border-l-4 ${isOwn ? 'bg-indigo-700/50 border-white/40' : 'bg-slate-50 border-indigo-500'
                }`}
            >
              <Text className={`text-[9px] font-black uppercase tracking-widest ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}>
                {replyOwner}
              </Text>
              <Text className={`text-xs ${isOwn ? 'text-white/80' : 'text-slate-500'}`} numberOfLines={1}>
                {item.replyTo.message || (item.replyTo.fileType?.startsWith('image/') ? '📷 Photo' : '📄 File')}
              </Text>
            </Pressable>
          )}

          {item.fileUrl && isImage && (
            <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl!)}>
              <Image source={{ uri: item.fileUrl }} style={{ width: 220, height: 180, borderRadius: 12 }} />
            </TouchableOpacity>
          )}

          {item.fileUrl && !isImage && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.fileUrl!)}
              className={`flex-row items-center p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}
            >
              <View className={`p-2 rounded-lg mr-2 ${isOwn ? 'bg-white/20' : 'bg-indigo-100'}`}>
                {item.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <FileText size={24} color={isOwn ? 'white' : '#6366f1'} />
                ) : (
                  <File size={24} color={isOwn ? 'white' : '#6366f1'} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text className={`text-xs font-bold ${isOwn ? 'text-white' : 'text-slate-800'}`} numberOfLines={2}>
                  {item.fileName || 'Attachment'}
                </Text>
                <Text className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>Document</Text>
              </View>
              <Download size={18} color={isOwn ? 'rgba(255,255,255,0.6)' : '#94a3b8'} />
            </TouchableOpacity>
          )}

          {!!item.message && (
            <MobileExpandableText
              text={item.message}
              isOwn={isOwn}
              highlight={searchTerm}
            />
          )}

          <View className="flex-row items-center justify-end mt-1">
            <Text className={`text-[9px] font-bold ${isOwn ? 'text-indigo-100/70' : 'text-slate-400'}`}>
              {item.isSending ? 'Sending...' : new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isOwn && !item.isSending && (
              item.isRead ? <CheckCheck size={14} color="#34B7F1" strokeWidth={3.5} /> : <Check size={14} color="rgba(255,255,255,0.6)" strokeWidth={3} />
            )}
          </View>
        </View>

        {!isSelected && (
          <Pressable
            onPress={() =>
              setReplyingTo({
                id: Number(item.id),
                senderId: Number(item.senderId),
                message: item.message,
                fileType: item.fileType,
                fileUrl: item.fileUrl,
                fileName: item.fileName,
              })
            }
            className={`mt-1 p-1 rounded-full bg-white border border-slate-100 ${isOwn ? 'mr-2' : 'ml-2'}`}
          >
            <CornerUpLeft size={13} color="#6366f1" />
          </Pressable>
        )}
      </Pressable>
    );
  };

  if (!currentUser) return null;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-2 py-3 border-b border-slate-50 bg-white">
        {selectedMessageIds.length > 0 ? (
          <View className="flex-1 flex-row items-center justify-between px-2">
            <View className="flex-row items-center">
              <Pressable onPress={() => setSelectedMessageIds([])} className="p-2">
                <X size={24} color="#475569" />
              </Pressable>
              <Text className="text-lg font-black text-slate-800 ml-4">{selectedMessageIds.length} Selected</Text>
            </View>
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  const textToCopy = messages
                    .filter((message) => selectedMessageIds.includes(Number(message.id)))
                    .map((message) => `${Number(message.senderId) === Number(currentUser?.id) ? 'Me' : name}: ${message.message}`)
                    .join('\\n');
                  Clipboard.setString(textToCopy);
                  Alert.alert('Copied', 'Messages copied to clipboard');
                  setSelectedMessageIds([]);
                }}
                className="p-3 bg-slate-50 rounded-xl mr-1"
              >
                <Copy size={20} color="#6366f1" />
              </Pressable>
              <Pressable onPress={() => void handleBulkDelete()} className="p-3 bg-red-50 rounded-xl">
                <Trash2 size={20} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => navigation.navigate('ChatList')} className="p-2">
                <ChevronLeft size={28} color="#1e293b" />
              </Pressable>
              <View className="w-10 h-10 rounded-2xl bg-indigo-500 items-center justify-center mr-3">
                <Text className="text-white font-black text-lg">{(recipient?.name || name).charAt(0).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-slate-800" numberOfLines={1}>{recipient?.name || name}</Text>
                <Text className="text-[10px] font-bold text-slate-400">
                  {isRecipientTyping
                    ? 'Typing...'
                    : recipient?.status?.isOnline
                      ? 'Available now'
                      : recipient?.status?.lastSeen
                        ? `Last seen ${formatMessageTime(recipient.status.lastSeen)}`
                        : 'Offline'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              {searchVisible && (
                <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl px-2 h-9 mr-1">
                  <TextInput
                    className="h-9 px-2 text-[10px] font-black w-24 text-slate-600 uppercase tracking-widest"
                    placeholder="SEARCH..."
                    placeholderTextColor="#cbd5e1"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    autoFocus
                  />
                  <Pressable onPress={() => { setSearchVisible(false); setSearchTerm(''); }}>
                    <X size={14} color="#94a3b8" />
                  </Pressable>
                </View>
              )}
              <Pressable onPress={() => setSearchVisible(!searchVisible)} className="p-2.5 rounded-xl">
                <Search size={20} color="#64748b" />
              </Pressable>
              <Pressable className="p-2.5">
                <MoreVertical size={20} color="#64748b" />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <FlatList
        ref={listRef}
        className="flex-1 w-full"
        style={{ flex: 1 }}
        data={groupedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 8, flexGrow: loading ? 1 : 0 }}
        ListEmptyComponent={loading ? <ActivityIndicator size="large" color="#6366f1" /> : null}
        ListFooterComponent={isRecipientTyping ? <TypingIndicator /> : null}
        onContentSizeChange={() => !searchTerm && listRef.current?.scrollToEnd({ animated: true })}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: true });
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
          }, 250);
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="bg-white border-t border-slate-50" style={{ paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) }}>
          {isUploading && (
            <View className="flex-row items-center justify-center py-2 bg-white border-b border-slate-50">
              <ActivityIndicator size="small" color="#6366f1" />
              <Text className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-2">Uploading File...</Text>
            </View>
          )}

          {pendingFile && (
            <View className="mx-3 mt-2 mb-1 bg-indigo-50 border border-indigo-100 rounded-2xl flex-row items-center px-3 py-2">
              {pendingFile.type.startsWith('image/') ? (
                <Image source={{ uri: pendingFile.uri }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }} />
              ) : (
                <View className="bg-indigo-100 p-2 rounded-lg mr-2">
                  <File size={20} color="#6366f1" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-xs font-bold text-indigo-700" numberOfLines={1}>{pendingFile.name}</Text>
                <Text className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mt-0.5">
                  {pendingFile.type.startsWith('image/') ? 'Image' : 'File'} ready to send
                </Text>
              </View>
              <Pressable onPress={() => setPendingFile(null)} className="p-1 ml-1">
                <X size={16} color="#6366f1" />
              </Pressable>
            </View>
          )}

          {replyingTo && (
            <View className="bg-slate-50 mx-3 mt-2 mb-1 p-3 rounded-2xl border-l-4 border-indigo-500 flex-row justify-between">
              <View className="flex-1">
                <Text className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                  Replying to {Number(replyingTo.senderId) === Number(currentUser?.id) ? 'Yourself' : name}
                </Text>
                <Text className="text-xs text-slate-500 font-medium" numberOfLines={1}>
                  {replyingTo.message || (replyingTo.fileType?.startsWith('image/') ? '📷 Photo' : '📄 File')}
                </Text>
              </View>
              <Pressable onPress={() => setReplyingTo(null)} className="p-1">
                <X size={16} color="#94a3b8" />
              </Pressable>
            </View>
          )}

          <View className="flex-row items-end px-3 py-3">
            <View className="flex-row items-center bg-slate-50 p-1 rounded-xl border border-slate-100 mr-2">
              <Pressable onPress={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg">
                <Smile size={20} color={showEmojiPicker ? '#6366f1' : '#64748b'} />
              </Pressable>
              <Pressable onPress={async () => {
                const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
                if (!result.canceled) {
                  const asset = result.assets[0];
                  setPendingFile({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
                }
              }} disabled={isUploading} className="p-2 rounded-lg">
                <Paperclip size={20} color={isUploading ? '#cbd5e1' : '#64748b'} />
              </Pressable>
              <Pressable onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
                if (!result.canceled) {
                  const asset = result.assets[0];
                  setPendingFile({ uri: asset.uri, name: asset.fileName || `photo_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' });
                }
              }} disabled={isUploading} className="p-2 rounded-lg">
                <ImageIcon size={20} color={isUploading ? '#cbd5e1' : '#64748b'} />
              </Pressable>
            </View>

            <View className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 px-4 min-h-[48px]">
              <TextInput
                className="text-slate-800 font-medium text-base w-full"
                placeholder={isUploading ? 'Uploading...' : 'Type a message...'}
                placeholderTextColor="#94a3b8"
                value={inputValue}
                onChangeText={handleInputChange}
                multiline
                editable={!isUploading}
                style={{ 
                  maxHeight: 120, 
                  minHeight: 48,
                  paddingTop: Platform.OS === 'ios' ? 14 : 12,
                  paddingBottom: Platform.OS === 'ios' ? 14 : 12,
                  textAlignVertical: 'center'
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => void handleSend()}
              disabled={(!inputValue.trim() && !pendingFile) || isUploading || isSending}
              className={`w-12 h-12 rounded-2xl items-center justify-center ml-2 ${(inputValue.trim() || pendingFile) && !isUploading && !isSending ? 'bg-indigo-600' : 'bg-slate-100'
                }`}
            >
              {isUploading || isSending ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Send
                  size={20}
                  color={inputValue.trim() || pendingFile ? 'white' : '#cbd5e1'}
                  strokeWidth={2.5}
                  fill={inputValue.trim() || pendingFile ? 'white' : 'none'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <EmojiKeyboard
        onEmojiSelected={(emoji: any) => {
          setInputValue((currentValue) => currentValue + emoji.emoji);
          setShowEmojiPicker(false);
        }}
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
      />
    </View>
  );
}
