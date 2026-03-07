import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react-native';
import { useAppSelector } from '../redux/hooks';
import { DrawerParamList } from '../navigation/types';
import { formatMessageTime } from '../utils/time';
import { initiateSocketConnection } from '../api/socket';
import {
  ChatUser,
  fetchChatUsersApi,
  normalizeChatUser,
  normalizeFileUrl,
} from '../api/chat';

type NavigationProp = DrawerNavigationProp<DrawerParamList, 'ChatList'>;

const updateUser = (
  users: ChatUser[],
  userId: number,
  updater: (user: ChatUser) => ChatUser
) => users.map((user) => (Number(user.id) === Number(userId) ? updater(user) : user));

export default function ChatListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser, token } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const nextUsers = await fetchChatUsersApi(Number(currentUser.id), token);
      setUsers((previousUsers) =>
        nextUsers.map((user) => {
          const existingUser = previousUsers.find(
            (previousUser) => Number(previousUser.id) === Number(user.id)
          );
          return {
            ...user,
            isTyping: existingUser?.isTyping ?? false,
          };
        })
      );
    } catch (error) {
      console.error('Failed to fetch chat users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  useEffect(() => {
    if (!currentUser?.id) return;

    const socket = initiateSocketConnection(Number(currentUser.id));

    const handleUserTyping = ({ userId, typing }: { userId: number; typing: boolean }) => {
      setUsers((previousUsers) =>
        updateUser(previousUsers, Number(userId), (user) => ({
          ...user,
          isTyping: typing,
        }))
      );
    };

    const handleNewMessage = (data: any) => {
      const senderId = Number(data.senderId);
      const receiverId = Number(data.receiverId);
      const otherUserId = senderId === Number(currentUser.id) ? receiverId : senderId;
      const isIncoming = receiverId === Number(currentUser.id);

      setUsers((previousUsers) =>
        updateUser(previousUsers, otherUserId, (user) => ({
          ...user,
          isTyping: false,
          lastMessage: data.message || null,
          lastMessageTime: data.createdAt || new Date().toISOString(),
          lastFileUrl: normalizeFileUrl(data.fileUrl),
          lastFileType: data.fileType || null,
          unreadCount:
            isIncoming && selectedUserId !== otherUserId
              ? Number(user.unreadCount || 0) + 1
              : 0,
        }))
      );
    };

    const handleMessagesRead = ({
      senderId,
      receiverId,
    }: {
      senderId: number;
      receiverId: number;
    }) => {
      if (Number(receiverId) !== Number(currentUser.id)) return;

      setUsers((previousUsers) =>
        updateUser(previousUsers, Number(senderId), (user) => ({
          ...user,
          unreadCount: 0,
        }))
      );
    };

    const handleStatusUpdate = ({
      userId,
      isOnline,
    }: {
      userId: number;
      isOnline: boolean;
    }) => {
      setUsers((previousUsers) =>
        updateUser(previousUsers, Number(userId), (user) => ({
          ...user,
          status: {
            isOnline,
            lastSeen: user.status?.lastSeen || new Date().toISOString(),
          },
        }))
      );
    };

    socket.on('user-typing', handleUserTyping);
    socket.on('new-message', handleNewMessage);
    socket.on('on-messages-read', handleMessagesRead);
    socket.on('status-update', handleStatusUpdate);

    return () => {
      socket.off('user-typing', handleUserTyping);
      socket.off('new-message', handleNewMessage);
      socket.off('on-messages-read', handleMessagesRead);
      socket.off('status-update', handleStatusUpdate);
    };
  }, [currentUser?.id, selectedUserId]);

  const chattedUsers = useMemo(() => {
    return users
      .filter(
        (user) => user.id !== currentUser?.id && (user.lastMessage || user.lastFileUrl)
      )
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.username || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((firstUser, secondUser) => {
        const firstTime = firstUser.lastMessageTime
          ? new Date(firstUser.lastMessageTime).getTime()
          : 0;
        const secondTime = secondUser.lastMessageTime
          ? new Date(secondUser.lastMessageTime).getTime()
          : 0;
        return secondTime - firstTime;
      });
  }, [currentUser?.id, searchTerm, users]);

  const allContacts = useMemo(() => {
    return users.filter(
      (user) =>
        user.id !== currentUser?.id &&
        (user.name.toLowerCase().includes(newChatSearch.toLowerCase()) ||
          (user.username || '').toLowerCase().includes(newChatSearch.toLowerCase()))
    );
  }, [currentUser?.id, newChatSearch, users]);

  const getLastMessagePreview = (user: ChatUser) => {
    if (user.isTyping) return 'typing...';
    if (user.lastMessage) return user.lastMessage;
    if (user.lastFileUrl) {
      return user.lastFileType?.startsWith('image/') ? '📷 Photo' : '📄 File';
    }
    return 'Start a conversation';
  };

  const openChat = (user: ChatUser, isNewChat = false) => {
    setSelectedUserId(user.id);
    setUsers((previousUsers) =>
      updateUser(previousUsers, user.id, (currentListUser) => ({
        ...currentListUser,
        unreadCount: 0,
      }))
    );
    if (isNewChat) {
      setIsNewChatOpen(false);
      setNewChatSearch('');
    }
    navigation.navigate('ChatDetail', { userId: user.id, name: user.name });
  };

  const renderUserItem = ({
    item,
    isNewChat = false,
  }: {
    item: ChatUser;
    isNewChat?: boolean;
  }) => (
    <Pressable
      onPress={() => openChat(item, isNewChat)}
      className={`flex-row items-center px-4 py-4 active:bg-slate-50 border-b border-slate-50 ${
        isNewChat ? 'mx-2 my-1 rounded-2xl' : ''
      }`}
    >
      <View className="relative">
        <View
          className={`w-14 h-14 rounded-2xl items-center justify-center shadow-sm ${
            isNewChat ? 'bg-indigo-400' : selectedUserId === item.id ? 'bg-indigo-600' : 'bg-indigo-500'
          }`}
        >
          <Text className="text-xl font-black text-white">
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        {item.status?.isOnline && (
          <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        )}
      </View>

      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-black text-slate-800 tracking-tight">
            {item.name}
          </Text>
          {item.lastMessageTime && !isNewChat && (
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-sm truncate flex-1 mr-2 ${
              item.isTyping
                ? 'font-black text-emerald-500'
                : item.unreadCount
                  ? 'font-bold text-slate-700'
                  : 'font-medium text-slate-500'
            }`}
            numberOfLines={1}
          >
            {isNewChat ? `@${item.username}` : getLastMessagePreview(item)}
          </Text>
          {!isNewChat && item.unreadCount !== undefined && item.unreadCount > 0 && (
            <View className="bg-indigo-600 h-5 min-w-[20px] rounded-full items-center justify-center px-1.5 shadow-sm">
              <Text className="text-[10px] font-black text-white">
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
          {isNewChat && (item.lastMessage || item.lastFileUrl) && (
            <View className="bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              <Text className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">
                Chat exists
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (loading && users.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4 bg-white flex-row items-center justify-between border-b border-slate-50">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg mr-3">
            <Text className="text-white font-black text-lg">
              {currentUser?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-800 tracking-tight">Messages</Text>
        </View>
        <View className="flex-row items-center space-x-1">
          <Pressable className="p-2.5 rounded-xl">
            <MessageSquare size={18} color="#64748b" />
          </Pressable>
          <Pressable className="p-2.5 rounded-xl">
            <MoreVertical size={18} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <View className="px-4 py-3">
        <View className="relative bg-slate-50 rounded-2xl border border-slate-100 flex-row items-center px-4 py-1">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 h-10 text-slate-700 font-bold text-sm"
            placeholder="Search conversations..."
            placeholderTextColor="#cbd5e1"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <FlatList
        data={chattedUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderUserItem({ item })}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20 px-10">
            <View className="w-20 h-20 rounded-3xl bg-slate-50 border border-dashed border-slate-200 items-center justify-center mb-5">
              <MessageSquare size={36} color="#cbd5e1" />
            </View>
            <Text className="text-slate-700 font-bold mb-1 text-base">No conversations yet</Text>
            <Text className="text-xs leading-relaxed text-slate-400 text-center mb-5">
              {searchTerm
                ? `No chats matching "${searchTerm}"`
                : 'Tap below to start your first chat!'}
            </Text>
            {!searchTerm && (
              <Pressable
                onPress={() => setIsNewChatOpen(true)}
                className="flex-row items-center space-x-2 px-6 py-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95"
              >
                <Plus size={18} color="white" strokeWidth={3} />
                <Text className="text-white text-sm font-bold ml-1">Start New Chat</Text>
              </Pressable>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, flexGrow: chattedUsers.length ? 0 : 1 }}
      />

      {chattedUsers.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsNewChatOpen(true)}
          style={{ position: 'absolute', bottom: 30, right: 30 }}
          className="w-16 h-16 bg-emerald-500 rounded-2xl items-center justify-center shadow-xl shadow-emerald-200/60"
        >
          <Plus size={30} color="white" strokeWidth={3} />
        </TouchableOpacity>
      )}

      <Modal
        visible={isNewChatOpen}
        animationType="slide"
        onRequestClose={() => setIsNewChatOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="bg-emerald-600 px-4 py-4 flex-row items-center shadow-lg">
            <Pressable
              onPress={() => {
                setIsNewChatOpen(false);
                setNewChatSearch('');
              }}
              className="p-2 mr-2"
            >
              <X size={24} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-black tracking-tight">New Message</Text>
          </View>

          <View className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
            <View className="bg-white rounded-2xl border border-emerald-100 flex-row items-center px-4 py-1 shadow-sm">
              <Search size={18} color="#10b981" />
              <TextInput
                className="flex-1 ml-3 h-10 text-slate-800 font-bold text-sm"
                placeholder="Search people..."
                placeholderTextColor="#94a3b8"
                autoFocus
                value={newChatSearch}
                onChangeText={setNewChatSearch}
              />
            </View>
          </View>

          <View className="flex-1">
            <View className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-50">
              <Text className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                All Contacts - {allContacts.length}
              </Text>
            </View>

            {allContacts.length > 0 ? (
              <FlatList
                data={allContacts}
                keyExtractor={(item) => `new-${item.id}`}
                renderItem={({ item }) => renderUserItem({ item, isNewChat: true })}
              />
            ) : (
              <View className="flex-col items-center justify-center py-20 text-slate-400 text-center">
                <UserPlus size={40} color="#e2e8f0" />
                <Text className="text-sm font-semibold text-slate-400 mt-4">
                  No contacts found
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
