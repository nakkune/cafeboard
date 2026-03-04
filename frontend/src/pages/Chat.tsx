import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Compass,
  Hash,
  MessageCircle,
  Plus,
  Search,
  Settings,
  X,
  Trash2,
  Send,
  Edit,
  Smile,
  Paperclip,
  Lock,
  MessageSquare,
  User,
  History,
  Loader2,
  FileText,
  Play,
  Menu
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useWebSocket } from '../hooks/useWebSocket';

interface Team {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  memberCount: number;
  channelCount: number;
  role?: string;
}

interface Channel {
  id: number;
  name: string;
  description: string | null;
  type: string;
  topic: string | null;
  role?: string;
  memberCount?: number;
  messageCount?: number;
}

interface Conversation {
  id: number;
  type: 'dm' | 'group';
  name: string | null;
  participants: any[];
  lastMessage?: any;
  unreadCount?: number;
}

interface Message {
  id: number;
  content: string;
  channelId?: number;
  conversationId?: number;
  author: {
    id: number;
    nickname: string;
    profileImage: string | null;
    presence?: {
      status: string;
      lastActiveAt: string | null;
    };
  };
  createdAt: string;
  isEdited: boolean;
  type?: 'text' | 'file';
  parentId: number | null;
  channel?: {
    name: string;
  };
  attachments?: {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
  reads?: {
    readAt: string;
  }[];
  _count?: {
    replies: number;
  };
  reactions?: {
    id: number;
    emoji: string;
    user: {
      id: number;
      nickname: string;
    };
  }[];
}

interface ThreadMessage {
  id: number;
  content: string;
  author: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
  createdAt: string;
  isEdited: boolean;
  reactions?: {
    id: number;
    emoji: string;
    user: {
      id: number;
      nickname: string;
    };
  }[];
}

interface ChannelMember {
  id: number;
  nickname: string;
  name: string | null;
  profileImage: string | null;
  role: string;
  joinedAt: string;
  presence?: {
    status: string;
    lastActiveAt: string | null;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function Chat() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [showThread, setShowThread] = useState(false);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [newThreadMessage, setNewThreadMessage] = useState('');

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTab, setSearchTab] = useState<'messages' | 'channels' | 'users'>('messages');
  const [searching, setSearching] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<ChannelMember[]>([]);

  const [showPublicTeams, setShowPublicTeams] = useState(false);
  const [publicTeams, setPublicTeams] = useState<Team[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; content: string; type: string }[]>([]);

  const addToast = useCallback((title: string, content: string, type: string = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, content, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ id: number; nickname: string }[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const [showChannelInviteModal, setShowChannelInviteModal] = useState(false);
  const [channelInviteUserId, setChannelInviteUserId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')} ` } });

  const channelIdRef = useRef<number | null>(null);
  const canManageTeam = selectedTeam?.role === 'owner' || selectedTeam?.role === 'admin';
  const canManageChannel = selectedChannel?.role === 'owner' || selectedChannel?.role === 'admin' || canManageTeam;

  const fetchTeams = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`, getAuthHeader());
      setTeams(res.data);
      if (res.data.length > 0 && !selectedTeam) {
        setSelectedTeam(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  const fetchJoinRequests = useCallback(async () => {
    const team = selectedTeam;
    if (!team) return;
    try {
      const res = await axios.get(`${API_URL}/teams/${team.id}/join-requests`, getAuthHeader());
      setJoinRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
    }
  }, [selectedTeam]);

  const fetchChannels = useCallback(async (teamId: number, keepChannel: boolean = false) => {
    try {
      const res = await axios.get(`${API_URL}/teams/${teamId}/channels`, getAuthHeader());
      setChannels(res.data);
      if (res.data.length > 0) {
        if (!keepChannel) {
          setSelectedChannel(res.data[0]);
        }
      } else {
        setSelectedChannel(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, []);

  const fetchTeamMembers = useCallback(async (teamId: number) => {
    try {
      const res = await axios.get(`${API_URL}/teams/${teamId}/members`, getAuthHeader());
      setTeamMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations`, getAuthHeader());
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  const startConversation = async (participantId: number) => {
    try {
      // 이미 존재하는 DM이 있는지 확인하고 있으면 연결, 없으면 생성
      const res = await axios.post(`${API_URL}/conversations`, {
        type: 'dm',
        participantIds: [participantId]
      }, getAuthHeader());

      const conv = res.data;
      // 대화 목록 갱신 및 선택
      await fetchConversations();
      setSelectedConversation(conv);
      setSelectedChannel(null); // 채널 선택 해제
      setMessages([]); // 기존 메시지 비우기 (새 대화용)
      setShowSettings(false); // 설정 모달 등이 열려있으면 닫기
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const fetchMessages = useCallback(async (channelId: number) => {
    console.log('[DEBUG] fetchMessages called for channel:', channelId);
    try {
      const res = await axios.get(`${API_URL}/channels/${channelId}/messages`, getAuthHeader());
      const newMessages = (res.data.messages || []).reverse();

      const messageMap = new Map();
      newMessages.forEach((msg: Message) => {
        messageMap.set(msg.id, msg);
      });
      const uniqueMessages = Array.from(messageMap.values());
      setMessages(uniqueMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);
  const fetchConversationMessages = useCallback(async (conversationId: number) => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, getAuthHeader());
      // 서버에서 desc로 오므로 프론트엔드 일관성을 위해 reverse()하거나 그대로 사용
      setMessages(res.data.messages.reverse());
    } catch (err) {
      console.error('Failed to fetch conversation messages:', err);
    }
  }, []);
  const fetchChannelMembers = useCallback(async (channelId: number) => {
    const team = selectedTeam;
    if (!team) return;
    try {
      const res = await axios.get(`${API_URL}/teams/${team.id}/channels/${channelId}/members`, getAuthHeader());
      setChannelMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch channel members:', err);
    }
  }, [selectedTeam]);



  const fetchPublicTeams = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/teams/public`, getAuthHeader());
      setPublicTeams(res.data);
    } catch (err) {
      console.error('Failed to fetch public teams:', err);
    }
  }, []);

  const joinTeam = useCallback(async (teamId: number) => {
    try {
      await axios.post(`${API_URL}/teams/${teamId}/join`, {}, getAuthHeader());
      alert('가입 요청이 전송되었습니다.');
      setShowPublicTeams(false);
      fetchPublicTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || '가입 요청 실패');
    }
  }, [fetchPublicTeams]);

  const respondToJoinRequest = useCallback(async (requestId: number, action: 'approve' | 'reject') => {
    const team = selectedTeam;
    if (!team) return;
    try {
      await axios.post(`${API_URL}/teams/${team.id}/join-requests/${requestId}`, { action }, getAuthHeader());
      setShowJoinRequests(false);
      setShowSettings(false); // 가입 승인/거절 후 모든 관련 팝업을 닫습니다.
      fetchJoinRequests();
      fetchTeams();
    } catch (err) {
      console.error('Failed to respond to join request:', err);
    }
  }, [selectedTeam, fetchJoinRequests, fetchTeams]);

  const handleNewMessage = useCallback((message: any) => {
    // 1. 메인 채널 메시지 처리
    if (channelIdRef.current && message.channelId === channelIdRef.current) {
      if (!message.parentId) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      } else {
        // 부모 메시지의 답글 수 업데이트
        setMessages(prev => prev.map(m =>
          m.id === message.parentId
            ? { ...m, _count: { ...m._count, replies: (m._count?.replies || 0) + 1 } }
            : m
        ));
      }
    }

    // 2. 현재 열려있는 스레드 메시지 처리
    if (message.parentId && threadMessageRef.current?.id === message.parentId) {
      setThreadMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  }, []);

  const handleConversationMessage = useCallback((message: any) => {
    if (selectedConversation && message.conversationId === selectedConversation.id) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
    fetchConversations();
  }, [selectedConversation, fetchConversations]);

  const handleMessageUpdate = useCallback((message: any) => {
    setMessages(prev => prev.map(m => m.id === message.id ? message : m));
  }, []);

  const handleMessageDelete = useCallback(({ messageId }: { messageId: number }) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const handleTyping = useCallback((data: { channelId: number; userId: number; isTyping: boolean; nickname?: string }) => {
    if (!selectedChannel || data.channelId !== selectedChannel.id) return;

    if (data.isTyping) {
      setTypingUsers(prev => {
        if (prev.some(u => u.id === data.userId)) return prev;
        return [...prev, { id: data.userId, nickname: data.nickname || 'Someone' }];
      });
    } else {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    }
  }, [selectedChannel]);

  const handleReaction = useCallback((data: any) => {
    console.log('[DEBUG] Reaction event received:', data);
    const { messageId } = data; // 시니어 개발자 팁: 필요 없는 비구조화 변수는 제거하여 린트 오류 방지

    // 시니어 개발자 팁: 전체 목록을 다시 페칭하는 대신 상태만 부분 업데이트하여 성능 최적화
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        let newReactions = msg.reactions || [];
        if (data.reaction) { // Added
          if (!newReactions.some(r => r.id === data.reaction.id)) {
            newReactions = [...newReactions, data.reaction];
          }
        } else if (data.emoji && data.userId) { // Removed
          newReactions = newReactions.filter(r => !(r.emoji === data.emoji && r.user.id === data.userId));
        }
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
  }, []);

  const handleJoinRequest = useCallback((data: any) => {
    console.log('[DEBUG] Join request event received:', data);
    alert(`${data.workspaceName} 팀에 ${data.userNickname}님이 가입 신청을 했습니다.`);

    // 페이지를 새로고침하여 가입 요청 카운트 및 UI를 최신화합니다.
    window.location.reload();
  }, []);

  const handleUserRemoved = useCallback((data: { workspaceId: number }) => {
    console.log('[DEBUG] User removed event received:', data);
    if (selectedTeam?.id === data.workspaceId) {
      alert('이 팀에서 제거되셨습니다. 페이지가 새로고침됩니다.');
      window.location.reload();
    } else {
      fetchTeams();
    }
  }, [selectedTeam, fetchTeams]);

  const handleStatusChange = useCallback((data: { userId: number; status: string }) => {
    console.log('[DEBUG] Status change event received:', data);
    setTeamMembers(prev => prev.map(m => m.id === data.userId ? { ...m, status: data.status } : m));
    setChannelMembers(prev => prev.map(m => m.id === data.userId ? { ...m, status: data.status } : m));
  }, []);

  const handleJoinApproved = useCallback((data: { workspaceId: number; workspaceName: string }) => {
    console.log('[DEBUG] Join approved event received:', data);
    alert(`${data.workspaceName} 팀 가입이 승인되었습니다! 페이지를 새로고침합니다.`);
    window.location.reload();
  }, []);

  const handleMemberUpdated = useCallback((data: any) => {
    console.log('[DEBUG] Member updated event received:', data);
    if (selectedTeam && selectedTeam.id === data.workspaceId) {
      // 1. 팀 목록 갱신 (사이드바의 팀원 수 배지 등)
      fetchTeams();
      // 2. 현재 팀의 멤버 목록 갱신 (팀 설정 팝업용)
      fetchTeamMembers(selectedTeam.id);
      // 3. 채널 목록 갱신 (기존 채널 유지하면서 정보만 업데이트)
      fetchChannels(selectedTeam.id, true);

      // 4. 오너인 경우 대기 중인 가입 요청 수도 갱신
      if (selectedTeam.role === 'owner') {
        fetchJoinRequests();
      }

      if (selectedChannel) {
        fetchChannelMembers(selectedChannel.id);
      }
    }
  }, [selectedTeam, selectedChannel, fetchTeams, fetchTeamMembers, fetchChannels, fetchChannelMembers, fetchJoinRequests]);

  const handleNotification = useCallback((notification: any) => {
    console.log('[DEBUG] New notification received:', notification);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    addToast(notification.title, notification.content, notification.type);
  }, [addToast]);

  const {
    isConnected,
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping,
    sendMessage: wsSendMessage,
    updateMessage: wsUpdateMessage,
    deleteMessage: wsDeleteMessage,
    joinTeam: joinWsTeam,
    leaveTeam: leaveWsTeam,
    joinConversation,
    leaveConversation,
    sendConversationMessage,
  } = useWebSocket({
    token: localStorage.getItem('accessToken') || '',
    onMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
    onTyping: handleTyping,
    onReaction: handleReaction,
    onConversationMessage: handleConversationMessage,
    onJoinRequest: handleJoinRequest,
    onUserRemoved: handleUserRemoved,
    onMemberUpdated: handleMemberUpdated,
    onNotification: handleNotification,
    onJoinApproved: handleJoinApproved,
    onStatusChange: handleStatusChange,
  });

  useEffect(() => {
    fetchTeams();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      const currentTeamId = selectedTeam.id;
      joinWsTeam(currentTeamId);
      fetchChannels(currentTeamId);
      fetchTeamMembers(currentTeamId);
      fetchConversations();
      // 오너일 경우 가입 요청 수도 미리 가져옴
      if (selectedTeam.role === 'owner') {
        fetchJoinRequests();
      }
      if (!selectedConversation) {
        setMessages([]);
      }

      return () => {
        leaveWsTeam(currentTeamId);
      };
    }
  }, [selectedTeam?.id, joinWsTeam, leaveWsTeam]);

  useEffect(() => {
    if (selectedChannel) {
      const currentChannelId = selectedChannel.id;
      channelIdRef.current = currentChannelId;
      console.log('[DEBUG] selectedChannel changed:', currentChannelId);
      fetchMessages(currentChannelId);
      fetchChannelMembers(currentChannelId);
      joinChannel(currentChannelId);
    }
    return () => {
      if (selectedChannel) {
        leaveChannel(selectedChannel.id);
      }
    };
  }, [selectedChannel?.id, joinChannel, leaveChannel]);

  useEffect(() => {
    if (selectedConversation) {
      const currentConversationId = selectedConversation.id;
      fetchConversationMessages(currentConversationId);
      joinConversation(currentConversationId);
    }
    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id, joinConversation, leaveConversation]);

  // Removed polling - now using WebSocket
  /*
  useEffect(() => {
    if (!selectedChannel) return;
    
    const pollInterval = setInterval(() => {
      if (selectedChannel) {
        fetchMessages(selectedChannel.id);
      }
    }, 3000);
   
    return () => clearInterval(pollInterval);
  }, [selectedChannel?.id]);
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Responsive sidebar - auto collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[DEBUG] File selected:', file?.name, 'Channel:', selectedChannel?.id);
    if (!file) {
      console.log('[DEBUG] No file selected');
      return;
    }
    if (!selectedChannel) {
      console.log('[DEBUG] No channel selected');
      alert('먼저 채널을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      console.log('[DEBUG] Uploading file...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('channelId', selectedChannel.id.toString());
      formData.append('originalName', encodeURIComponent(file.name));

      const res = await axios.post(`${API_URL}/chat/upload`, formData, {
        ...getAuthHeader(),
        headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
          setUploadProgress(percentCompleted);
        }
      });

      console.log('[DEBUG] Upload success:', res.data);
      addToast('업로드 완료', `${file.name} 파일이 업로드되었습니다.`, 'success');
      // No need to manually fetch messages as WebSocket will handle 'message_new'
      // But clearing state is good
    } catch (err) {
      console.error('File upload failed:', err);
      addToast('업로드 실패', '파일 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '🔥', '💯', '🙏', '😢', '😮', '👋', '🚀'];

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, getAuthHeader());
      const data = res.data.notifications || [];
      setNotifications(data);
      const unread = data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationAsRead = async (id: number | null) => {
    try {
      const url = id
        ? `${API_URL}/notifications/${id}/read`
        : `${API_URL}/notifications/read-all`;
      await axios.put(url, {}, getAuthHeader());
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };



  const deleteTeam = async () => {
    if (!selectedTeam || !confirm('이 팀을 삭제하시겠습니까?')) return;
    if (selectedTeam.channelCount > 0) {
      alert('팀에 채널이 있으면 삭제할 수 없습니다. 먼저 채널을 삭제해주세요.');
      return;
    }
    try {
      await axios.delete(`${API_URL}/teams/${selectedTeam.id}`, getAuthHeader());
      setTeams(teams.filter(t => t.id !== selectedTeam.id));
      setSelectedTeam(null);
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;

    try {
      if (selectedChannel) {
        wsSendMessage(selectedChannel.id, content);
        stopTyping(selectedChannel.id);
      } else if (selectedConversation) {
        sendConversationMessage(selectedConversation.id, content);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const threadMessageRef = useRef<Message | null>(null);

  const openThread = async (message: Message) => {
    setThreadMessage(message);
    threadMessageRef.current = message;
    setShowThread(true);
    setThreadMessages([]); // Reset messages while loading

    try {
      const res = await axios.get(
        `${API_URL}/messages/${message.id}/thread`,
        getAuthHeader()
      );
      setThreadMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch thread:', err);
    }
  };

  const sendThreadMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadMessage.trim() || !selectedChannel || !threadMessage) return;

    try {
      // WebSocket으로 보내는 것이 이상적이지만, 기존 방식(REST)을 유지하며 최적화
      const res = await axios.post(
        `${API_URL}/channels/${selectedChannel.id}/messages`,
        { content: newThreadMessage, parentId: threadMessage.id },
        getAuthHeader()
      );
      // handleNewMessage에서 중복 처리를 방지하기 위해 로컬 업데이트는 신중해야 함
      // 하지만 REST 응답을 즉시 보여주는 것이 속도감이 좋으므로 유지 (중복 체크 guard가 handleNewMessage에 있음)
      setThreadMessages(prev => [...prev.filter(m => m.id !== res.data.id), res.data]);
      setNewThreadMessage('');

      setMessages(prev => prev.map(m =>
        m.id === threadMessage.id
          ? { ...m, _count: { ...m._count, replies: (m._count?.replies || 0) + 1 } }
          : m
      ));
    } catch (err) {
      console.error('Failed to send thread message:', err);
    }
  };

  const handleSearch = useCallback(async (query: string, tab: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      let endpoint = '';
      if (tab === 'messages') endpoint = `${API_URL}/search/messages?q=${encodeURIComponent(query)}`;
      else if (tab === 'channels') endpoint = `${API_URL}/search/channels?q=${encodeURIComponent(query)}`;
      else if (tab === 'users') endpoint = `${API_URL}/search/users?q=${encodeURIComponent(query)}`;

      const res = await axios.get(endpoint, getAuthHeader());
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch) handleSearch(searchQuery, searchTab);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTab, showSearch, handleSearch]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/teams`,
        { name: newTeamName, description: newTeamDescription },
        getAuthHeader()
      );
      setTeams([...teams, res.data]);
      setSelectedTeam(res.data);
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };



  const handleCreateChannel = async () => {
    if (!selectedTeam || !newChannelName.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/teams/${selectedTeam.id}/channels`,
        {
          name: newChannelName,
          description: newChannelDescription,
          type: newChannelType
        },
        getAuthHeader()
      );
      setChannels([...channels, res.data]);
      setSelectedChannel(res.data);
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleUpdateChannel = async () => {
    if (!selectedTeam || !selectedChannel || !editChannelName.trim()) return;
    try {
      const res = await axios.put(
        `${API_URL}/teams/${selectedTeam.id}/channels/${selectedChannel.id}`,
        {
          name: editChannelName,
          description: editChannelDescription
        },
        getAuthHeader()
      );
      setChannels(channels.map(ch => ch.id === selectedChannel.id ? res.data : ch));
      setSelectedChannel(res.data);
      setShowEditChannelModal(false);
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const deleteChannel = async () => {
    if (!selectedTeam || !selectedChannel || !confirm('이 채널을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(
        `${API_URL}/teams/${selectedTeam.id}/channels/${selectedChannel.id}`,
        getAuthHeader()
      );
      setChannels(channels.filter(ch => ch.id !== selectedChannel.id));
      setSelectedChannel(channels[0] || null);
      setShowChannelSettings(false);
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleAddChannelMember = async () => {
    if (!selectedTeam || !selectedChannel || !channelInviteUserId) return;
    try {
      await axios.post(
        `${API_URL}/teams/${selectedTeam.id}/channels/${selectedChannel.id}/members`,
        { userId: channelInviteUserId },
        getAuthHeader()
      );
      fetchChannelMembers(selectedChannel.id);
      setShowChannelInviteModal(false);
      setChannelInviteUserId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || '멤버 추가 실패');
    }
  };

  const removeChannelMember = async (userId: number) => {
    if (!selectedTeam || !selectedChannel || !confirm('이 멤버를 채널에서 제외하시겠습니까?')) return;
    try {
      await axios.delete(
        `${API_URL}/teams/${selectedTeam.id}/channels/${selectedChannel.id}/members/${userId}`,
        getAuthHeader()
      );
      setChannelMembers(channelMembers.filter(m => m.id !== userId));
    } catch (err) {
      console.error('Failed to remove channel member:', err);
    }
  };

  const updateChannelMemberRole = async (userId: number, role: string) => {
    if (!selectedTeam || !selectedChannel) return;
    try {
      await axios.put(
        `${API_URL}/teams/${selectedTeam.id}/channels/${selectedChannel.id}/members/${userId}`,
        { role },
        getAuthHeader()
      );
      fetchChannelMembers(selectedChannel.id);
    } catch (err: any) {
      alert(err.response?.data?.error || '권한 변경 실패');
    }
  };

  const removeMember = async (userId: number) => {
    if (!selectedTeam || !confirm(t('chat.removeMemberConfirm'))) return;

    try {
      await axios.delete(
        `${API_URL}/teams/${selectedTeam.id}/members/${userId}`,
        getAuthHeader()
      );
      setTeamMembers(teamMembers.filter(m => m.id !== userId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleInviteUser = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    try {
      await axios.post(`${API_URL}/teams/${selectedTeam.id}/members`, { email: inviteEmail }, getAuthHeader());
      alert('사용자가 팀에 추가되었습니다.');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchTeamMembers(selectedTeam.id);
    } catch (err: any) {
      alert(err.response?.data?.error || '초대 실패');
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !editTeamName.trim()) return;
    try {
      const res = await axios.put(
        `${API_URL}/teams/${selectedTeam.id}`,
        { name: editTeamName, description: editTeamDescription },
        getAuthHeader()
      );
      setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, name: res.data.name, description: res.data.description } : t));
      setSelectedTeam({ ...selectedTeam, name: res.data.name, description: res.data.description });
      setShowEditTeamModal(false);
      addToast('변경 완료', '팀 정보가 수정되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to update team:', err);
      addToast('변경 실패', '팀 정보 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    if (!window.confirm('정말 이 팀을 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.')) return;

    try {
      await axios.delete(`${API_URL}/teams/${selectedTeam.id}`, getAuthHeader());
      const remainingTeams = teams.filter(t => t.id !== selectedTeam.id);
      setTeams(remainingTeams);
      setSelectedTeam(remainingTeams.length > 0 ? remainingTeams[0] : null);
      setShowSettings(false);
      addToast('삭제 완료', '팀이 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete team:', err);
      addToast('삭제 실패', '팀 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const changeMemberRole = async (memberId: number, newRole: string) => {
    if (!selectedTeam) return;
    try {
      await axios.put(`${API_URL}/teams/${selectedTeam.id}/members/${memberId}`, { role: newRole }, getAuthHeader());
      fetchTeamMembers(selectedTeam.id);
    } catch (err: any) {
      alert(err.response?.data?.error || '권한 변경 실패');
    }
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const myReaction = message.reactions?.find(r => r.emoji === emoji && r.user.id === user?.id);

    try {
      if (myReaction) {
        // 이미 내가 한 반응이면 삭제
        await axios.delete(`${API_URL}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, getAuthHeader());
        // 로컬 상태 동기화 (WebSocket이 오겠지만 즉각적 반응을 위해 선제적 업데이트 가능)
      } else {
        // 새로운 반응 추가
        await axios.post(`${API_URL}/messages/${messageId}/reactions`, { emoji }, getAuthHeader());
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const startEditMessage = (message: Message) => {
    if (message.author.id !== user?.id) return;
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      wsUpdateMessage(editingMessage.id, editContent);
      setEditingMessage(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit message via WS:', err);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm('메시지를 삭제하시겠습니까?')) return;

    try {
      wsDeleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message via WS:', err);
    }
  };

  const markAsRead = async () => {
    if (!selectedChannel || messages.length === 0) return;

    try {
      await axios.post(
        `${API_URL}/channels/${selectedChannel.id}/read`,
        { messageId: messages[0].id },
        getAuthHeader()
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  if (loading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 
        WORKSPACE RAIL (Leftmost slim bar)
        Senior Developer Pattern: Decoupling Workspace selection from Channel navigation.
      */}
      <aside className="w-20 bg-slate-950 flex flex-col items-center py-6 gap-4 z-50 shadow-2xl border-r border-slate-800">
        {/* Home / Exit */}
        <button
          onClick={() => { window.location.href = '/'; }}
          className="workspace-rail-item group"
          title="홈으로"
        >
          <Compass size={24} className="group-hover:rotate-45 transition-transform duration-500" />
        </button>

        <div className="w-8 h-px bg-slate-800 my-2" />

        {/* Dynamic Workspace List */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center gap-4 px-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`workspace-rail-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
              title={team.name}
            >
              <div className="text-lg font-black uppercase">
                {team.name[0]}
              </div>
            </button>
          ))}

          {/* Add Team Button */}
          <button
            onClick={() => setShowCreateTeam(true)}
            className="w-12 h-12 rounded-[18px] bg-slate-800/50 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-all duration-300 border border-slate-700 hover:border-emerald-400"
            title="새 팀 생성"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Search / Discover Teams */}
        <button
          onClick={() => { fetchPublicTeams(); setShowPublicTeams(true); }}
          className="w-12 h-12 rounded-2xl bg-slate-800/30 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 border border-slate-800"
          title="팀 탐색"
        >
          <Search size={20} />
        </button>
      </aside>

      {/* BACKDROP for Mobile Sidebar */}
      {!sidebarCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* 
        SECONDARY SIDEBAR (Channels & DMs)
      */}
      <div className={`${sidebarCollapsed ? 'w-0 md:w-0' : 'w-[85vw] md:w-64'} fixed md:relative left-0 top-0 bottom-0 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out z-[60] md:z-40 h-full border-r border-slate-800 overflow-hidden`}>
        <div className="p-6 border-b border-slate-800/50 flex flex-col gap-1 min-w-[256px]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-white truncate">
              {selectedTeam?.name || "Workspace"}
            </h1>
            {canManageTeam && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col py-4">
          {/* Channels Section */}
          <div className="mb-8">
            <div className="px-6 py-2 flex items-center justify-between group/section">
              <h1 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{t('chat.channels')}</h1>
              {canManageTeam && (
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="opacity-0 group-hover/section:opacity-100 w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-indigo-600 rounded text-slate-400 hover:text-white transition-all"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>
            <div className="px-3 space-y-0.5 mt-2">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => {
                    if (selectedChannel?.id !== channel.id) {
                      setSelectedChannel(channel);
                      setSelectedConversation(null);
                      setMessages([]);
                      markAsRead();
                    }
                  }}
                  className={`w-full group px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${selectedChannel?.id === channel.id
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                  {channel.type === 'private' ? (
                    <Lock size={16} className={selectedChannel?.id === channel.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'} />
                  ) : (
                    <Hash size={16} className={selectedChannel?.id === channel.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'} />
                  )}
                  <span className="text-sm font-semibold truncate">{channel.name}</span>
                </button>
              ))}
              {channels.length === 0 && (
                <p className="px-6 py-4 text-xs font-semibold text-slate-600 italic">생성된 채널이 없습니다</p>
              )}
            </div>
          </div>

          {/* DMs Section */}
          <div>
            <div className="px-6 py-2">
              <h1 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">다이렉트 메시지</h1>
            </div>
            <div className="px-3 space-y-0.5 mt-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    if (selectedConversation?.id !== conv.id) {
                      setSelectedConversation(conv);
                      setSelectedChannel(null);
                      setMessages([]);
                    }
                  }}
                  className={`w-full group px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${selectedConversation?.id === conv.id
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                      {conv.name?.[0] || 'U'}
                    </div>
                  </div>
                  <span className="text-sm font-semibold truncate">{conv.name}</span>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="px-6 py-4 text-xs font-semibold text-slate-600 italic">대화 내용이 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-950/20">
          <div className="bg-slate-800/50 rounded-2xl p-3 flex items-center justify-between border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.nickname?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.nickname}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none mt-1 items-center flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </p>
              </div>
            </div>
            {selectedTeam && (
              <button
                onClick={() => { fetchJoinRequests(); setShowSettings(true); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                title="팀 설정"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 
        MAIN CHAT PANEL
      */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {selectedChannel || selectedConversation ? (
          <>
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                {sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                  {selectedChannel ? <Hash size={18} /> : <MessageCircle size={18} />}
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 truncate uppercase tracking-widest leading-none">
                    {selectedChannel?.name || selectedConversation?.name}
                  </h2>
                  {selectedChannel && canManageChannel && (
                    <button
                      onClick={() => setShowChannelSettings(true)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-all"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">● Online</span>
                  {selectedChannel?.description && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] text-slate-400 truncate">{selectedChannel.description}</span>
                    </>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button onClick={() => setShowSearch(true)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all">
                    <Search size={18} />
                  </button>
                  <button onClick={() => { fetchNotifications(); setShowNotifications(!showNotifications); }} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 relative transition-all">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                </div>
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar bg-slate-50/30">
              {messages.map((message, index) => {
                const isMyMessage = message.author.id === user?.id;
                const authorStatus = message.author.presence?.status || 'offline';
                const showAvatar = index === 0 || messages[index - 1].author.id !== message.author.id;

                return (
                  <div key={message.id} className={`flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 flex-shrink-0 ${!showAvatar ? 'opacity-0 h-0 overflow-hidden' : ''}`}>
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white ${isMyMessage ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                          {message.author.nickname[0]}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${authorStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      </div>
                    </div>

                    <div className={`flex flex-col max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMyMessage ? 'flex-row-reverse text-right' : ''}`}>
                          <span className="text-sm font-bold text-slate-900">{message.author.nickname}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                              className="w-full bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-0 resize-none outline-none rounded-lg p-2"
                              rows={2}
                            />
                            <div className="flex gap-2 justify-end mt-2">
                              <button onClick={cancelEditMessage} className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white">Cancel</button>
                              <button onClick={saveEditMessage} className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}

                        {/* Hover Actions Menu */}
                        <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-1 p-1 bg-white rounded-xl shadow-xl border border-slate-100 ${isMyMessage ? 'right-full mr-2' : 'left-full ml-2'}`}>
                          {['👍', '❤️', '🔥', '✅'].map(emoji => (
                            <button key={emoji} onClick={() => toggleReaction(message.id, emoji)} className="p-1.5 hover:bg-slate-50 rounded-lg text-sm transition-transform hover:scale-125">{emoji}</button>
                          ))}
                          <div className="w-px h-6 bg-slate-100 mx-1 self-center"></div>
                          <button onClick={() => openThread(message)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600" title="Reply"><MessageSquare size={14} /></button>
                          {isMyMessage && (
                            <>
                              <button onClick={() => startEditMessage(message)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600" title="Edit"><Edit size={14} /></button>
                              <button onClick={() => deleteMessage(message.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500" title="Delete"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reply Count Badge */}
                      {(message._count?.replies ?? 0) > 0 && !message.parentId && (
                        <button
                          onClick={() => openThread(message)}
                          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMyMessage
                            ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex-row-reverse'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(3, message._count?.replies ?? 0))].map((_, i) => (
                              <div key={i} className="w-4 h-4 rounded-full bg-slate-400 border border-white flex items-center justify-center text-[8px] text-white">
                                <User size={8} />
                              </div>
                            ))}
                          </div>
                          <span>{message._count?.replies ?? 0} 답글</span>
                        </button>
                      )}

                      {/* Attachments & Reactions */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className={`mt-3 flex flex-wrap gap-3 ${isMyMessage ? 'justify-end' : ''}`}>
                          {message.attachments.map(att => {
                            const isImage = att.mimeType.startsWith('image/');
                            const isVideo = att.mimeType.startsWith('video/');
                            const fullUrl = att.url.startsWith('http') ? att.url : `${API_URL.replace('/api', '')}${att.url}`;

                            if (isImage) {
                              return (
                                <div key={att.id} className="group relative rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden">
                                  <img src={fullUrl} className="max-w-[320px] max-h-[240px] object-cover transition-transform group-hover:scale-105 duration-500" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-3">
                                    <button
                                      onClick={() => window.open(fullUrl, '_blank')}
                                      className="opacity-0 group-hover:opacity-100 bg-white/90 p-3 rounded-full shadow-lg transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-110"
                                      title="보기"
                                    >
                                      <Search size={20} className="text-slate-700" />
                                    </button>
                                    <a
                                      href={fullUrl}
                                      download={att.originalName}
                                      className="opacity-0 group-hover:opacity-100 bg-indigo-600 p-3 rounded-full shadow-lg transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-indigo-700 hover:scale-110 text-white"
                                      title="다운로드"
                                    >
                                      <Plus size={20} />
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            if (isVideo) {
                              return (
                                <div key={att.id} className="w-[320px] rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-black relative group">
                                  <video className="w-full aspect-video" controls>
                                    <source src={fullUrl} type={att.mimeType} />
                                    Your browser does not support the video tag.
                                  </video>
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
                                    <Play size={10} fill="currentColor" />
                                    VIDEO
                                  </div>
                                  <a
                                    href={fullUrl}
                                    download={att.originalName}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md p-2 rounded-lg text-white transition-all hover:bg-white/40"
                                    title="다운로드"
                                  >
                                    <Plus size={14} />
                                  </a>
                                </div>
                              );
                            }

                            return (
                              <a
                                key={att.id}
                                href={fullUrl}
                                download={att.originalName}
                                className="p-4 flex items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group min-w-[240px] max-w-sm"
                              >
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                  <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{att.originalName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{Math.round(att.size / 1024)} KB</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">CLICK TO DOWNLOAD</span>
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {message.reactions && message.reactions.length > 0 && (
                        <div className={`mt-2 flex flex-wrap gap-1.5 ${isMyMessage ? 'justify-end' : ''}`}>
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || []);
                              acc[r.emoji].push(r);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([emoji, reactions]) => {
                            const isMine = reactions.some((r: any) => r.user.id === user?.id);
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
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center"><MessageCircle size={40} /></div>
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
            <div className="p-6 bg-slate-50/50 relative">
              {/* Upload Progress Overlay */}
              {uploading && (
                <div className="absolute top-0 left-6 right-6 -translate-y-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-t-2xl p-4 shadow-xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">파일 업로드 중...</p>
                        <p className="text-xs font-black text-indigo-600">{uploadProgress}%</p>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                        if (selectedChannel && e.target.value) {
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          startTyping(selectedChannel.id);
                          typingTimeoutRef.current = setTimeout(() => { stopTyping(selectedChannel.id); }, 2000);
                        }
                      }}
                      placeholder={`Message ${selectedChannel?.name || selectedConversation?.name}...`}
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
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-6 p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center">
              <Compass size={40} className="text-slate-200" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Welcome Back</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {teams.length === 0
                  ? "아직 소속된 팀이 없습니다. 왼쪽의 '+' 버튼을 눌러 새로운 팀을 생성하거나 팀을 찾아보세요."
                  : "대화를 시작할 채널이나 메시지를 선택해주세요."}
              </p>
            </div>
          </div>
        )}
      </main>

      {showThread && threadMessage && (
        <>
          {/* Thread Backdrop for Mobile */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
            onClick={() => setShowThread(false)}
          />
          <aside className="fixed inset-y-0 right-0 lg:relative lg:inset-auto w-[90%] sm:w-[500px] lg:w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-50 lg:z-40 h-full animate-in slide-in-from-right duration-500">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">스레드</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">#{selectedChannel?.name}</p>
              </div>
              <button onClick={() => setShowThread(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Parent Message Card */}
              <div className="p-6 bg-slate-50/30 border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white">
                    {threadMessage.author.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-black text-slate-900">{threadMessage.author.nickname}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(threadMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{threadMessage.content}</p>
                  </div>
                </div>
              </div>

              {/* Replies List */}
              <div className="px-6 py-8 space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{threadMessages.length} REPLIES</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                {threadMessages.map(msg => (
                  <div key={msg.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      {msg.author.nickname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-black text-slate-900">{msg.author.nickname}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {threadMessages.length === 0 && (
                  <div className="py-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <MessageCircle size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">첫 답글을 남겨주세요</p>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Box */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
              <form onSubmit={sendThreadMessage} className="relative group">
                <div className="glass-effect rounded-2xl border border-slate-200/50 shadow-xl p-1 pl-4 flex items-center gap-3">
                  <input
                    type="text"
                    value={newThreadMessage}
                    onChange={e => setNewThreadMessage(e.target.value)}
                    placeholder="답글 남기기..."
                    className="flex-1 bg-transparent py-3 text-xs text-slate-800 placeholder-slate-400 outline-none font-bold"
                  />
                  <button type="submit" disabled={!newThreadMessage.trim()} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95">
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </>
      )}

      {showNotifications && (
        <div className="absolute top-20 right-8 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-200 z-[60] overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">알림 ({unreadCount})</h3>
            <button
              onClick={() => markNotificationAsRead(null)}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter hover:bg-white px-2 py-1 rounded-md transition-all"
            >
              모두 읽음으로 표시
            </button>
          </div>
          <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">새로운 알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`p-5 hover:bg-slate-50 transition-all cursor-pointer group relative ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                    )}
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.type === 'mention' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                        {notification.type === 'mention' ? <Smile size={18} /> : <Hash size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{notification.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-normal mb-2">{notification.content}</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <button onClick={() => setShowNotifications(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Toast System */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="w-80 bg-slate-900 text-white rounded-[1.5rem] p-5 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 duration-300 border border-slate-800 backdrop-blur-xl bg-opacity-90 pointer-events-auto"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-500 text-white shadow-lg`}>
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1 leading-none">{toast.title}</p>
              <p className="text-sm font-bold truncate leading-tight">{toast.content}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className="ml-auto p-1 hover:bg-slate-800 rounded-lg text-slate-500 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {showSearch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[80] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
            {/* Search Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={24} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="무엇을 찾고 계신가요?"
                  className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl placeholder-slate-300"
                  autoFocus
                />
              </div>

              <div className="flex gap-4 mt-6">
                {[
                  { id: 'messages', label: '메시지', icon: MessageSquare },
                  { id: 'channels', label: '채널', icon: Hash },
                  { id: 'users', label: '멤버', icon: User },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSearchTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${searchTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                        }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching global network...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchTab === 'messages' && searchResults.map(msg => (
                    <div
                      key={msg.id}
                      className="p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer group flex gap-4"
                      onClick={() => {
                        if (msg.channelId) {
                          setSelectedChannel(msg.channel);
                          setShowSearch(false);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {msg.author?.nickname?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-900">{msg.author?.nickname}</span>
                          <span className="text-[10px] font-bold text-slate-400">in #{msg.channel?.name}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  {searchTab === 'channels' && searchResults.map(ch => (
                    <div
                      key={ch.id}
                      className="p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
                      onClick={() => {
                        setSelectedChannel(ch);
                        setShowSearch(false);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white group-hover:bg-indigo-600 transition-colors">
                          <Hash size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">#{ch.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">멤버 {ch.memberCount}명 | {ch.workspace?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {searchTab === 'users' && searchResults.map(u => (
                    <div
                      key={u.id}
                      className="p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between group"
                      onClick={() => {
                        // DM logic could go here
                        setShowSearch(false);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
                          {u.nickname?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">{u.nickname}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{u.email}</p>
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${u.presence?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                    <History size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search messages, channels, and people</p>
                </div>
              )}
            </div>

            {/* Search Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-400 shadow-sm">ESC</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Close</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-400 shadow-sm">ENTER</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Select</span>
                </div>
              </div>
              <button onClick={() => setShowSearch(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Teams Modal */}
      {
        showPublicTeams && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">팀 찾기</h3>
                <button onClick={() => setShowPublicTeams(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {publicTeams.length > 0 ? (
                  <div className="space-y-3">
                    {publicTeams.map(team => (
                      <div key={team.id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-xs text-gray-500">
                            멤버 {team.memberCount}명 | 채널 {team.channelCount}개
                          </div>
                          {team.description && (
                            <div className="text-sm text-gray-600 mt-1">{team.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => joinTeam(team.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          가입 요청
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">가입 가능한 공개 팀이 없습니다</p>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Create Team Modal */}
      {
        showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">팀 생성</h3>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="팀 이름"
                className="w-full px-4 py-2 border rounded-lg mb-3"
                autoFocus
              />
              <textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="팀 설명 (선택)"
                className="w-full px-4 py-2 border rounded-lg mb-4 h-24 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowCreateTeam(false); setNewTeamName(''); setNewTeamDescription(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        )
      }

      {showCreateChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">채널 생성</h3>
              <button onClick={() => setShowCreateChannel(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">CHANNEL NAME</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</div>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="channel-name"
                    className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-black"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">DESCRIPTION</label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="무엇에 대한 채널인가요?"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none h-24 resize-none font-medium text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">CHANNEL TYPE</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewChannelType('public')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newChannelType === 'public'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <Hash size={20} />
                    <span className="text-xs font-bold">Public</span>
                  </button>
                  <button
                    onClick={() => setNewChannelType('private')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newChannelType === 'private'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <Lock size={20} />
                    <span className="text-xs font-bold">Private</span>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowCreateChannel(false); setNewChannelName(''); setNewChannelDescription(''); }}
                  className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  생성하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal (for team owner) */}
      {
        showJoinRequests && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">가입 요청</h3>
                <button onClick={() => setShowJoinRequests(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {joinRequests.length > 0 ? (
                  <div className="space-y-3">
                    {joinRequests.map(request => (
                      <div key={request.id} className="p-3 border rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            {request.user.nickname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{request.user.nickname}</div>
                            <div className="text-xs text-gray-500">{request.user.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToJoinRequest(request.id, 'approve')}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => respondToJoinRequest(request.id, 'reject')}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">대기 중인 가입 요청이 없습니다</p>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Team Settings Modal */}
      {
        showSettings && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{selectedTeam.name} - {t('chat.settings')}</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {(selectedTeam.role === 'owner' || selectedTeam.role === 'admin') && (
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> 멤버 초대
                    </button>
                    <button
                      onClick={() => {
                        setEditTeamName(selectedTeam.name);
                        setEditTeamDescription(selectedTeam.description || '');
                        setShowEditTeamModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
                    >
                      <Edit size={16} /> 팀 정보 수정
                    </button>
                  </div>
                )}

                {selectedTeam.role === 'owner' && (
                  <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                    <button
                      onClick={() => { fetchJoinRequests(); setShowJoinRequests(true); }}
                      className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      가입 요청 승인 ({joinRequests.length || 0})
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className="w-full px-3 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> 이 팀 영구 삭제
                    </button>
                  </div>
                )}

                <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-4">{t('chat.teamMembers')} ({teamMembers.length})</h4>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl group border border-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.profileImage ? (
                            <img src={member.profileImage} alt={member.nickname} className="w-10 h-10 rounded-xl" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {member.nickname[0]}
                            </div>
                          )}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${(member.presence?.status || 'offline') === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{member.nickname}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md tracking-tighter">{member.role}</span>
                            {member.id === user?.id && <span className="text-[10px] font-black uppercase text-slate-400">ME</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {member.id !== user?.id && (
                          <button
                            onClick={() => startConversation(member.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="메시지 보내기"
                          >
                            <MessageCircle size={18} />
                          </button>
                        )}

                        {/* Role Management Dropdown for Owner */}
                        {selectedTeam?.role === 'owner' && member.id !== user?.id && (
                          <select
                            value={member.role}
                            onChange={(e) => changeMemberRole(member.id, e.target.value)}
                            className="text-[10px] font-bold border rounded-lg p-1 bg-white outline-none"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        )}

                        {selectedTeam?.role === 'owner' && member.role !== 'owner' && member.id !== user?.id && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="멤버 삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTeam.role === 'owner' && selectedTeam.channelCount === 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={deleteTeam}
                      className="w-full px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> 이 팀 완전 삭제하기
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">이 작업은 취소할 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {showChannelSettings && selectedChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500">
                  {selectedChannel.type === 'private' ? <Lock size={24} /> : <Hash size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-none">#{selectedChannel.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Channel Settings</p>
                </div>
              </div>
              <button onClick={() => setShowChannelSettings(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setShowChannelInviteModal(true)}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> 멤버 추가
                </button>
                <button
                  onClick={() => {
                    setEditChannelName(selectedChannel.name);
                    setEditChannelDescription(selectedChannel.description || '');
                    setShowEditChannelModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Edit size={18} /> 채널 정보 수정
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-4 px-2">Members ({channelMembers.length})</h4>
                  <div className="space-y-2">
                    {channelMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200 shadow-sm">
                              {member.nickname[0]}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${member.presence?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none">{member.nickname}</p>
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">{member.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Role Update dropdown for channel owner/admin */}
                          {(selectedChannel.role === 'owner' || selectedChannel.role === 'admin') && member.id !== user?.id && (
                            <select
                              value={member.role}
                              onChange={(e) => updateChannelMemberRole(member.id, e.target.value)}
                              className="text-[10px] font-bold border rounded-lg p-1 bg-white outline-none"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </select>
                          )}

                          {(selectedChannel.role === 'owner' || selectedChannel.role === 'admin') && member.id !== user?.id && member.role !== 'owner' && (
                            <button
                              onClick={() => removeChannelMember(member.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              title="멤버 삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedChannel.role === 'owner' && (
                  <div className="pt-6 border-t border-slate-100">
                    <button
                      onClick={deleteChannel}
                      className="w-full px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> 이 채널 영구 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invite Member Modal */}
      {
        showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">멤버 초대</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">팀에 초대할 사용자의 이메일 주소를 입력해주세요.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                    className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim()}
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                  >
                    초대하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Team Modal */}
      {
        showEditTeamModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">팀 정보 수정</h3>
                <button onClick={() => setShowEditTeamModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">TEAM NAME</label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="팀 이름"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">DESCRIPTION</label>
                  <textarea
                    value={editTeamDescription}
                    onChange={(e) => setEditTeamDescription(e.target.value)}
                    placeholder="팀에 대한 간단한 설명을 입력하세요."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none h-32 resize-none font-medium leading-relaxed"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditTeamModal(false)}
                    className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdateTeam}
                    disabled={!editTeamName.trim()}
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Edit Channel Modal */}
      {showEditChannelModal && selectedChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">채널 수정</h3>
              <button onClick={() => setShowEditChannelModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">CHANNEL NAME</label>
                <input
                  type="text"
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-black"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">DESCRIPTION</label>
                <textarea
                  value={editChannelDescription}
                  onChange={(e) => setEditChannelDescription(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none h-24 resize-none font-medium text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditChannelModal(false)}
                  className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateChannel}
                  disabled={!editChannelName.trim()}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  변경사항 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Member Invite Modal */}
      {showChannelInviteModal && selectedChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">채널에 멤버 추가</h3>
              <button onClick={() => setShowChannelInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">SELECT TEAM MEMBER</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold shadow-sm"
                  onChange={(e) => setChannelInviteUserId(parseInt(e.target.value))}
                  value={channelInviteUserId || ''}
                >
                  <option value="">멤버 선택...</option>
                  {teamMembers
                    .filter(tm => !channelMembers.some(cm => cm.id === tm.id))
                    .map(member => (
                      <option key={member.id} value={member.id}>{member.nickname} ({member.role})</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowChannelInviteModal(false); setChannelInviteUserId(null); }}
                  className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleAddChannelMember}
                  disabled={!channelInviteUserId}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  멤버 추가하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
