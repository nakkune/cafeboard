import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Plus, X, Search, Smile, Paperclip, Trash2, ChevronLeft, Compass, Users, Check, UserPlus, UserMinus, Settings, Crown, Edit2, Save } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../api';

const API_URL = import.meta.env.VITE_API_URL || '/api';
interface Conversation {
  id: number;
  type: 'dm' | 'group';
  name: string | null;
  participants: {
    id: number;
    nickname: string;
    name?: string | null;
    profileImage: string | null;
  }[];
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    authorId: number;
  };
  unreadCount?: number;
}

interface Message {
  id: number;
  content: string;
  conversationId: number;
  author: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
  createdAt: string;
  isEdited?: boolean;
  type?: 'text' | 'file';
  reactions?: {
    id: number;
    emoji: string;
    user: { id: number; nickname: string };
  }[];
  attachments?: {
    id: number;
    url: string;
    mimeType: string;
    originalName: string;
    size: number;
  }[];
}

interface User {
  id: number;
  nickname: string;
}

export default function DirectMessage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group chat states
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [participantSearchResults, setParticipantSearchResults] = useState<User[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Pro features state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '🔥', '💯', '🙏', '😢', '😮', '👋', '🚀'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ id: number; nickname: string }[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();


  // 1. Basic Utils
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const getCurrentUserId = useCallback(() => user?.id ?? 0, [user?.id]);

  // 2. Data Fetching (Defined early for scoping)
  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      let data = res.data;
      if (!Array.isArray(data)) {
        data = data.messages || [];
      }
      setMessages((data as any[]).reverse());
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    }
  }, [scrollToBottom]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      let data = res.data;
      if (!Array.isArray(data)) {
        data = data.conversations || [];
      }

      setConversations(data);

      if (selectedConversation) {
        const updatedConv = data.find((c: Conversation) => c.id === selectedConversation.id);
        if (updatedConv) setSelectedConversation(updatedConv);
      } else if (data.length > 0) {
        setSelectedConversation(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  // 3. WebSocket Handlers
  const handleNewConversationMessage = useCallback((message: any) => {
    if (!selectedConversation || message.conversationId !== selectedConversation.id) return;
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
    scrollToBottom();
  }, [selectedConversation, scrollToBottom]);

  const handleMessageUpdate = useCallback((updatedMessage: any) => {
    setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
  }, []);

  const handleMessageDelete = useCallback((data: { messageId: number }) => {
    setMessages(prev => prev.filter(m => m.id !== data.messageId));
  }, []);

  const handleTyping = useCallback((data: { channelId?: number; conversationId?: number; userId: number; isTyping: boolean }) => {
    if (selectedConversation && data.conversationId === selectedConversation.id && data.userId !== getCurrentUserId()) {
      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.find(u => u.id === data.userId)) {
            return [...prev, { id: data.userId, nickname: '상대방' }];
          }
          return prev;
        } else {
          return prev.filter(u => u.id !== data.userId);
        }
      });
    }
  }, [selectedConversation, getCurrentUserId]);

  const handleReaction = useCallback((data: any) => {
    if (selectedConversation?.id === data.conversationId) {
      fetchMessages(data.conversationId);
    }
  }, [selectedConversation?.id, fetchMessages]);

  const {
    joinConversation, leaveConversation, sendConversationMessage,
    updateMessage: wsUpdateMessage, deleteMessage: wsDeleteMessage,
    startTyping, stopTyping
  } = useWebSocket({
    token: localStorage.getItem('accessToken') || '',
    onConversationMessage: handleNewConversationMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
    onTyping: handleTyping,
    onReaction: handleReaction
  });

  // 4. Effects
  useEffect(() => {
    fetchConversations();
  }, []); // Initial load only

  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
      joinConversation(selectedConversation.id);
    }
    return () => {
      if (selectedConversation?.id) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id, fetchMessages, joinConversation, leaveConversation]);

  // 5. Actions
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/search/users?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', selectedConversation.id.toString());
      formData.append('originalName', encodeURIComponent(file.name));

      await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    const myReaction = message.reactions?.find(r => r.emoji === emoji && r.user.id === getCurrentUserId());
    try {
      if (myReaction) {
        await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      } else {
        await api.post(`/messages/${messageId}/reactions`, { emoji });
      }
    } catch (err) { console.error('Failed to toggle reaction:', err); }
  };

  const startEditMessageObj = (message: Message) => {
    if (message.author.id !== getCurrentUserId()) return;
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const saveEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;
    try {
      wsUpdateMessage(editingMessage.id, editContent);
      setEditingMessage(null);
      setEditContent('');
    } catch (err) { }
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const deleteMessageObj = async (messageId: number) => {
    if (!confirm('메시지를 삭제하시겠습니까?')) return;
    try {
      wsDeleteMessage(messageId);
    } catch (err) { }
  };

  const createConversation = async () => {
    if (selectedUserIds.length === 0) return;

    const isGroup = selectedUserIds.length > 1;
    if (isGroup && !groupName.trim()) {
      alert('그룹 이름을 입력해주세요.');
      return;
    }

    try {
      const res = await api.post('/conversations', {
        type: isGroup ? 'group' : 'dm',
        name: isGroup ? groupName : null,
        participantIds: selectedUserIds
      });

      const newConv = res.data;
      const mappedParticipants = newConv.participants?.map((p: any) =>
        p.user ? { ...p.user, role: p.role } : p
      ) || [];
      const normalizedConv = { ...newConv, participants: mappedParticipants };

      setConversations(prev => {
        if (prev.find(c => c.id === normalizedConv.id)) return prev;
        return [normalizedConv, ...prev];
      });

      setSelectedConversation(normalizedConv);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUserIds([]);
      setGroupName('');
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddParticipant = async (targetUserId: number) => {
    if (!selectedConversation || selectedConversation.type === 'dm') return;
    try {
      const res = await api.post(`/conversations/${selectedConversation.id}/participants`, { userId: targetUserId });
      const newParticipant = res.data;

      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          participants: [...(prev.participants || []), newParticipant]
        };
      });

      setParticipantSearchQuery('');
      setParticipantSearchResults([]);
    } catch (err) {
      console.error('Failed to add participant:', err);
      alert('멤버 추가에 실패했습니다.');
    }
  };

  const handleRemoveParticipant = async (targetUserId: number) => {
    if (!selectedConversation || selectedConversation.type === 'dm') return;
    if (!window.confirm('이 멤버를 강퇴하시겠습니까?')) return;

    try {
      await api.delete(`/conversations/${selectedConversation.id}/participants/${targetUserId}`);

      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          participants: prev.participants.filter(p => p.id !== targetUserId)
        };
      });
    } catch (err) {
      console.error('Failed to remove participant:', err);
      alert('멤버 강퇴에 실패했습니다.');
    }
  };

  const handleUpdateName = async () => {
    if (!selectedConversation || !editingNameValue.trim()) return;
    try {
      const res = await api.put(`/conversations/${selectedConversation.id}`, { name: editingNameValue });
      const updatedConv = res.data;

      setSelectedConversation(prev => prev ? { ...prev, name: updatedConv.name } : null);
      setConversations(prev => prev.map(c => c.id === updatedConv.id ? { ...c, name: updatedConv.name } : c));
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
      alert('방 이름 검색에 실패했습니다.');
    }
  };

  const handleTransferOwnership = async (targetUserId: number) => {
    if (!selectedConversation || selectedConversation.type === 'dm') return;
    if (!window.confirm('방장 권한을 넘기시겠습니까? 당신은 관리자(Admin)가 됩니다.')) return;

    try {
      await api.put(`/conversations/${selectedConversation.id}/participants/${targetUserId}`, { role: 'owner' });

      // Refresh participants to see new roles
      const res = await api.get(`/conversations/${selectedConversation.id}/participants`);
      const updatedParticipants = res.data;

      setSelectedConversation(prev => prev ? { ...prev, participants: updatedParticipants } : null);
    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      alert('권한 위임에 실패했습니다.');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const content = newMessage;
    setNewMessage('');

    if (selectedConversation.id > 0) {
      sendConversationMessage(selectedConversation.id, content);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Premium Conversations Sidebar (Mobile Responsive) */}
      <div className={`w-full md:w-80 bg-slate-900 border-r border-slate-800 flex-col shadow-xl z-20 h-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-800/50 bg-slate-900 sticky top-0">
          <div className="flex items-center justify-between mb-5">
            <div />
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-sm"
              title="새 대화 시작"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Direct Messages</h1>
              <span className="text-[11px] font-semibold text-slate-400">
                {user?.nickname || 'Guest'}
              </span>
            </div>
          </div>
        </div>



        {/* New Chat Modal (Glassmorphism) */}
        {showNewChat && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl border border-slate-200/50 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-indigo-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">새 대화 시작</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSelectedUserIds([]);
                    setGroupName('');
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                {selectedUserIds.length > 1 && (
                  <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-2">그룹 이름</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="그룹 이름을 입력하세요..."
                      className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-bold text-slate-700"
                    />
                  </div>
                )}

                <div className="relative group mb-4 sticky top-0 bg-white z-10 pb-2">
                  <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="사용자 아이디 또는 이름 검색..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-medium"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`group p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all border ${selectedUserIds.includes(u.id)
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-slate-50 border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                          {(u.nickname?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <span className={`font-semibold ${selectedUserIds.includes(u.id) ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {u.nickname}
                        </span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUserIds.includes(u.id)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 bg-white'
                        }`}>
                        {selectedUserIds.includes(u.id) && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  ))}

                  {searchQuery && searchResults.length === 0 && (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><Search size={24} /></div>
                      <p className="text-sm font-semibold text-slate-500">검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                  disabled={selectedUserIds.length === 0}
                  onClick={createConversation}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {selectedUserIds.length > 1 ? (
                    <><Users size={16} /> {selectedUserIds.length}명과 그룹 대화 시작</>
                  ) : (
                    <><Send size={16} /> 대화 시작하기</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4 border border-slate-700/50">
                <MessageSquare size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-400 mb-6">진행 중인 대화가 없습니다</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
              >
                새 대화 시작하기
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const currentUserId = getCurrentUserId();
              let displayName = '';
              let avatarChar = '';

              if (conv.type === 'dm') {
                const otherUser = conv.participants?.find(p => p.id !== currentUserId);
                displayName = otherUser?.nickname || otherUser?.name || 'Unknown User';
                avatarChar = (displayName.charAt(0) || '?').toUpperCase();
              } else {
                displayName = conv.name || 'Group Chat';
                avatarChar = (displayName.charAt(0) || 'G').toUpperCase();
              }

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`group px-3 py-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${selectedConversation?.id === conv.id
                    ? 'bg-indigo-600/10 text-white border-indigo-500/20 shadow-inner'
                    : 'hover:bg-slate-800/60 text-slate-300 border-transparent hover:border-slate-700/50'
                    }`}
                >
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-sm transition-colors ${selectedConversation?.id === conv.id
                      ? 'bg-indigo-500 text-white'
                      : conv.type === 'group'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}>
                      {conv.type === 'group' ? <Users size={18} /> : avatarChar}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-bold text-sm truncate ${selectedConversation?.id === conv.id ? 'text-indigo-300' : 'group-hover:text-white'}`}>
                        {displayName}
                      </p>
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-[11px] truncate ${selectedConversation?.id === conv.id ? 'text-indigo-200/70 font-medium' : 'text-slate-500 font-medium'}`}>
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                      {conv.unreadCount}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden bg-slate-50/50 h-full ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation && (
          <div className="absolute top-6 right-8 z-50">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md hover:bg-slate-900 hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 border border-slate-200 group"
              title="홈으로"
            >
              <Compass size={24} className="group-hover:rotate-45 transition-transform duration-500" />
            </button>
          </div>
        )}
        {selectedConversation && !loading ? (
          <>
            {/* Header */}
            <div className="px-4 md:px-8 py-4 glass-effect border-b border-gray-200/50 flex items-center gap-4 sticky top-0 z-30 shadow-sm bg-white/80 backdrop-blur-md">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm font-black ${selectedConversation.type === 'group'
                ? 'bg-purple-50 border-purple-100 text-purple-600'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                {selectedConversation.type === 'group' ? (
                  <Users size={20} />
                ) : (
                  (selectedConversation.participants?.find(p => p.id !== getCurrentUserId())?.nickname?.charAt(0) || '?').toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-slate-800 text-lg tracking-tight leading-tight">
                  {selectedConversation.type === 'group'
                    ? selectedConversation.name || 'Group Chat'
                    : selectedConversation.participants?.find(p => p.id !== getCurrentUserId())?.nickname || 'Direct Message'}
                </h2>
                {selectedConversation.type === 'group' && (
                  <button
                    onClick={() => setShowParticipants(true)}
                    className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 hover:text-indigo-500 transition-colors"
                  >
                    <Users size={10} /> {selectedConversation.participants?.length}명의 멤버
                  </button>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {selectedConversation.type === 'group' && (
                  <button
                    onClick={() => setShowParticipants(true)}
                    className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-200"
                    title="멤버 관리"
                  >
                    <Settings size={20} />
                  </button>
                )}
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-sm active:scale-95 border border-slate-200 group"
                  title="홈으로"
                >
                  <Compass size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
              {(messages || []).map((message, index) => {
                const currentUserId = getCurrentUserId();
                const isMyMessage = message.author.id === currentUserId;
                const authorName = message.author?.nickname || 'Unknown';
                const showAvatar = index === 0 || messages[index - 1].author.id !== message.author.id;

                return (
                  <div key={message.id} className={`flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 flex-shrink-0 ${!showAvatar ? 'opacity-0 h-0 overflow-hidden' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white ${isMyMessage ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        {(authorName.charAt(0) || '?').toUpperCase()}
                      </div>
                    </div>
                    <div className={`flex flex-col max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMyMessage ? 'flex-row-reverse text-right' : ''}`}>
                          <span className="text-sm font-bold text-slate-900">{authorName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.isEdited && <span className="ml-1 opacity-70">(수정됨)</span>}
                          </span>
                        </div>
                      )}

                      <div className={`relative px-5 py-3.5 rounded-3xl shadow-sm text-sm border transition-all hover:shadow-md ${isMyMessage
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-400 rounded-tr-sm'
                        : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'
                        }`}>
                        {editingMessage?.id === message.id ? (
                          <div className="min-w-[200px]">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className={`w-full bg-white/10 border-white/20 placeholder-white/50 focus:ring-0 resize-none outline-none rounded-lg p-2 ${isMyMessage ? 'text-white' : 'text-slate-800 bg-slate-100 border-slate-300'}`}
                              rows={2}
                            />
                            <div className="flex gap-2 justify-end mt-2">
                              <button onClick={cancelEditMessage} className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity ${isMyMessage ? 'text-white/70' : 'text-slate-400'}`}>Cancel</button>
                              <button onClick={saveEditMessage} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg ${isMyMessage ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>Save</button>
                            </div>
                          </div>
                        ) : (
                          message.type !== 'file' ? (
                            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          ) : null
                        )}

                        {/* Hover Actions Menu */}
                        {!editingMessage && (
                          <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-1 p-1 bg-white rounded-xl shadow-xl border border-slate-100 ${isMyMessage ? 'right-full mr-2' : 'left-full ml-2'}`}>
                            {['👍', '❤️', '😂', '✅'].map(emoji => (
                              <button key={emoji} onClick={() => toggleReaction(message.id, emoji)} className="p-1.5 hover:bg-slate-50 rounded-lg text-sm transition-transform hover:scale-125">{emoji}</button>
                            ))}
                            <div className="w-px h-6 bg-slate-100 mx-1 self-center"></div>
                            {isMyMessage && (
                              <>
                                <button onClick={() => startEditMessageObj(message)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600" title="Edit">✏️</button>
                                <button onClick={() => deleteMessageObj(message.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500" title="Delete"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attachments & Reactions display */}
                      {message.attachments && message.attachments.length > 0 && !editingMessage && (
                        <div className={`mt-3 flex flex-wrap gap-2 ${isMyMessage ? 'justify-end' : ''}`}>
                          {message.attachments.map(att => {
                            const isImage = att.mimeType?.startsWith('image/');
                            const fullUrl = att.url.startsWith('http') ? att.url : `${API_URL.replace('/api', '')}${att.url}`;

                            if (isImage) {
                              return (
                                <div key={att.id} className="group/att relative rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden">
                                  <img src={fullUrl} className="max-w-[240px] max-h-[180px] object-cover" alt="Attachment" />
                                  <div className="absolute inset-0 bg-black/0 group-hover/att:bg-black/20 transition-all flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => window.open(fullUrl, '_blank')}
                                      className="opacity-0 group-hover/att:opacity-100 bg-white/90 p-2.5 rounded-full shadow-lg transform translate-y-2 group-hover/att:translate-y-0 transition-all hover:bg-white hover:scale-110"
                                      title="보기"
                                    >
                                      <Search size={16} className="text-slate-700" />
                                    </button>
                                    <a
                                      href={fullUrl}
                                      download={att.originalName}
                                      className="opacity-0 group-hover/att:opacity-100 bg-indigo-600 p-2.5 rounded-full shadow-lg transform translate-y-2 group-hover/att:translate-y-0 transition-all hover:bg-indigo-700 hover:scale-110 text-white"
                                      title="다운로드"
                                    >
                                      <Paperclip size={16} />
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <a
                                key={att.id}
                                href={fullUrl}
                                download={att.originalName}
                                className="p-3 flex items-center gap-3 w-[220px] rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all group/file"
                              >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover/file:bg-indigo-50 flex items-center justify-center text-slate-500 group-hover/file:text-indigo-600 transition-colors">
                                  <Paperclip size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-700 truncate group-hover/file:text-indigo-700 transition-colors">{att.originalName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">{Math.round(att.size / 1024)} KB</p>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {message.reactions && message.reactions.length > 0 && !editingMessage && (
                        <div className={`mt-2 flex flex-wrap gap-1.5 ${isMyMessage ? 'justify-end' : ''}`}>
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || []);
                              acc[r.emoji].push(r);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([emoji, reactions]) => {
                            const isMine = reactions.some((r: any) => r.user.id === getCurrentUserId());
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(message.id, emoji)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 hover:scale-110 active:scale-95 ${isMine ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                                  }`}
                              >
                                <span>{emoji}</span>
                                <span>{reactions.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center"><MessageSquare size={40} /></div>
                  <p className="font-black uppercase tracking-widest text-xs">Waiting for your first move...</p>
                </div>
              )}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-1 animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Someone is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Premium Floating Input Console */}
            <div className="p-6 bg-slate-50/50">
              <form onSubmit={sendMessage} className="relative group">
                <div className="glass-effect rounded-[2rem] border border-slate-200/50 shadow-2xl p-2 pl-6 transition-all focus-within:ring-4 focus-within:ring-indigo-100/50">
                  <div className="flex items-center gap-4">
                    <label className="flex-shrink-0 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-indigo-100">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                      <Paperclip size={20} />
                    </label>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => {
                        setNewMessage(e.target.value);
                        if (selectedConversation && e.target.value) {
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          // For DMs, the socket payload actually expects a channelId structure but our server likely handles conversation ID typings. Let's pass it anyway.
                          startTyping(selectedConversation.id); // Note: Server needs to handle channelId gracefully as conversationId.
                          typingTimeoutRef.current = setTimeout(() => { stopTyping(selectedConversation.id); }, 2000);
                        }
                      }}
                      placeholder="메시지 입력..."
                      className="flex-1 bg-transparent py-4 text-slate-800 placeholder-slate-400 outline-none font-medium"
                    />
                    <div className="flex items-center gap-2 pr-2">
                      <div className="relative">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all border border-transparent hover:border-amber-100">
                          <Smile size={22} />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-4 glass-effect border border-slate-200 rounded-2xl shadow-2xl p-3 grid grid-cols-5 gap-2 w-56 backdrop-blur-3xl">
                            {commonEmojis.map((emoji, idx) => (
                              <button key={idx} type="button" onClick={() => handleEmojiClick(emoji)} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-xl transition-transform hover:scale-125 transform active:scale-90">{emoji}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-[1.25rem] flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_8px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0">
                        <Send size={20} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-white shadow-xl border border-slate-100 flex items-center justify-center transform hover:scale-105 transition-all">
              <MessageSquare size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-black text-slate-700 tracking-tight mb-2">프리미엄 1:1 채팅</h2>
            <p className="text-sm font-medium">대화를 선택하거나 새 대화를 시작하세요.</p>
          </div>
        )}
      </div>
      {/* Participant Management Modal */}
      {showParticipants && selectedConversation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-indigo-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">멤버 관리</h2>
              </div>
              <button
                onClick={() => {
                  setShowParticipants(false);
                  setParticipantSearchQuery('');
                  setParticipantSearchResults([]);
                }}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              {/* Group Name Editing */}
              <div className="mb-6 pb-6 border-b border-slate-100">
                <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-2">방 이름 수정</label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm font-bold"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group/name">
                    <span className="text-sm font-bold text-slate-700">{selectedConversation.name || '방 이름 없음'}</span>
                    <button
                      onClick={() => {
                        setEditingNameValue(selectedConversation.name || '');
                        setIsEditingName(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover/name:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-3">새 멤버 초대</label>
                <div className="relative group mb-4">
                  <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={participantSearchQuery}
                    onChange={async (e) => {
                      setParticipantSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) {
                        try {
                          const res = await api.get(`/users/search?q=${e.target.value}`);
                          setParticipantSearchResults(res.data.filter((u: User) =>
                            !selectedConversation.participants.some(p => p.id === u.id)
                          ));
                        } catch (err) {
                          console.error('User search failed:', err);
                        }
                      } else {
                        setParticipantSearchResults([]);
                      }
                    }}
                    placeholder="사용자 아이디 또는 이름 검색..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-medium"
                  />
                </div>
                {participantSearchResults.length > 0 && (
                  <div className="space-y-1 mb-4 animate-in fade-in duration-200">
                    {participantSearchResults.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 hover:bg-indigo-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                            {(u.nickname?.charAt(0) || '?').toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{u.nickname}</span>
                        </div>
                        <button
                          onClick={() => handleAddParticipant(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <UserPlus size={12} /> 초대
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-3">현재 멤버 ({selectedConversation.participants.length})</label>
                <div className="space-y-2">
                  {selectedConversation.participants.map((p) => {
                    const isOwner = (selectedConversation.participants.find(part => part.id === getCurrentUserId()) as any)?.role === 'owner';
                    const isAdmin = (selectedConversation.participants.find(part => part.id === getCurrentUserId()) as any)?.role === 'admin';
                    const targetIsMe = p.id === getCurrentUserId();
                    const targetIsOwner = (p as any).role === 'owner';

                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${targetIsMe ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                            {(p.nickname?.charAt(0) || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {p.nickname} {targetIsMe && <span className="text-[10px] text-indigo-500 font-bold ml-1">(나)</span>}
                            </p>
                            <span className={`text-[10px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded ${targetIsOwner ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                              }`}>
                              {(p as any).role || 'member'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!targetIsMe && isOwner && !targetIsOwner && (
                            <button
                              onClick={() => handleTransferOwnership(p.id)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-amber-500 rounded-xl hover:bg-amber-50 hover:border-amber-100 transition-all hover:shadow-sm"
                              title="방장 위임"
                            >
                              <Crown size={18} />
                            </button>
                          )}
                          {!targetIsMe && !targetIsOwner && (isOwner || isAdmin) && (
                            <button
                              onClick={() => handleRemoveParticipant(p.id)}
                              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-all hover:shadow-sm"
                              title="강퇴하기"
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-medium text-center">
                방장(Owner) 또는 관리자(Admin)만 멤버를 강퇴할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
