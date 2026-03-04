/**
 * ============================================================
 * 📡 useWebSocket - React WebSocket 커스텀 훅
 * ============================================================
 *
 * 커스텀 훅(Custom Hook)이란?
 * - React의 useState, useEffect 같은 훅 기능을 조합해서
 *   "재사용 가능한 로직 덩어리"로 만든 함수입니다.
 * - 이름이 반드시 'use'로 시작해야 합니다. (React 규칙)
 * - 어떤 컴포넌트에서든 import해서 사용할 수 있습니다.
 *
 * 이 훅이 하는 일:
 * 1. Socket.IO 연결 생성 및 관리
 * 2. 서버에서 오는 이벤트를 콜백 함수로 전달
 * 3. 채널 입/퇴장, 메시지 전송 등 액션 함수 제공
 * 4. 컴포넌트 언마운트 시 소켓 연결 자동 정리
 *
 * 사용 예시:
 *   const { isConnected, sendMessage, joinChannel } = useWebSocket({
 *     token: '사용자JWT토큰',
 *     onMessage: (msg) => setMessages(prev => [...prev, msg]),
 *   });
 * ============================================================
 */

// React 훅들을 가져옵니다.
// useEffect  : 사이드 이펙트 처리 (소켓 연결/해제 등)
// useRef     : 렌더링과 무관하게 값을 유지하는 참조 (소켓 인스턴스 보관)
// useState   : 컴포넌트 상태 관리 (연결 여부)
// useCallback: 함수를 메모이제이션해서 불필요한 재생성 방지
import { useEffect, useRef, useState, useCallback } from 'react';

// Socket.IO 클라이언트 라이브러리
// io     : 서버에 연결하는 함수
// Socket : 연결된 소켓의 타입 (TypeScript용)
import { io, Socket } from 'socket.io-client';

// ============================================================
// 타입 정의 (TypeScript Interface)
// ============================================================

/**
 * UseWebSocketOptions: 이 훅에 전달할 수 있는 옵션들의 타입입니다.
 *
 * Interface란?
 * - "이 객체는 이런 속성들을 가진다"고 TypeScript에게 알려주는 설계도입니다.
 * - ? 가 붙은 속성은 optional(있어도 되고, 없어도 되는) 속성입니다.
 *
 * 콜백 함수(Callback):
 * - "이벤트가 발생했을 때 실행할 함수"를 미리 등록해두는 패턴입니다.
 * - 예: onMessage를 등록해두면 새 메시지가 올 때마다 자동으로 호출됩니다.
 */
interface UseWebSocketOptions {
  token: string; // 필수: 서버 인증에 사용할 JWT 토큰

  // 아래는 모두 선택(optional) 콜백 함수들입니다.
  // 해당 이벤트가 발생했을 때 호출될 함수를 컴포넌트에서 직접 정의합니다.

  onMessage?: (message: any) => void;           // 새 채널 메시지 수신 시
  onMessageUpdate?: (message: any) => void;     // 메시지 수정 시
  onMessageDelete?: (data: { messageId: number }) => void; // 메시지 삭제 시
  onTyping?: (data: {                           // 타이핑 상태 변경 시
    channelId: number;
    userId: number;
    isTyping: boolean;                          // true: 입력 중, false: 입력 중지
  }) => void;
  onReaction?: (data: any) => void;             // 이모지 반응 추가/제거 시
  onConversationMessage?: (message: any) => void; // 새 DM 메시지 수신 시
  onJoinRequest?: (data: any) => void;          // 새 팀 가입 요청 시 (오너 전용)
  onUserRemoved?: (data: { workspaceId: number }) => void; // 워크스페이스에서 추방되었을 때
  onMemberUpdated?: (data: any) => void;        // 멤버 목록 변경 시 (추가/삭제 등)
  onNotification?: (notification: any) => void; // 새 알림 수신 시
  onJoinApproved?: (data: { workspaceId: number; workspaceName: string }) => void; // 팀 가입 승인 시 (신청자 전용)
  onStatusChange?: (data: { userId: number; status: string }) => void; // 사용자 상태 변경 시
}

/**
 * UseWebSocketReturn: 이 훅이 반환하는 값들의 타입입니다.
 *
 * 훅을 사용하는 컴포넌트에서 구조 분해로 꺼내 쓸 수 있습니다.
 * 예: const { isConnected, sendMessage } = useWebSocket(options);
 */
interface UseWebSocketReturn {
  isConnected: boolean; // 현재 WebSocket 연결 상태 (true: 연결됨, false: 끊김)

  // 채널/대화방 입퇴장 함수
  joinChannel: (channelId: number) => void;             // 채널 입장
  leaveChannel: (channelId: number) => void;            // 채널 퇴장
  joinConversation: (conversationId: number) => void;   // DM 대화방 입장
  leaveConversation: (conversationId: number) => void;  // DM 대화방 퇴장

  // 메시지 관련 함수
  sendMessage: (channelId: number, content: string, type?: string, parentId?: number) => void;
  sendConversationMessage: (conversationId: number, content: string) => void;
  updateMessage: (messageId: number, content: string) => void;
  deleteMessage: (messageId: number) => void;

  // 타이핑 표시 함수
  startTyping: (channelId: number) => void;
  stopTyping: (channelId: number) => void;

  // 기타 기능
  readMessage: (channelId: number, messageId: number) => void;
  joinTeam: (teamId: number) => void;
  leaveTeam: (teamId: number) => void;
}

// ============================================================
// 훅 본체
// ============================================================

/**
 * useWebSocket: WebSocket 연결 전체를 관리하는 커스텀 훅입니다.
 *
 * @param options - 토큰과 이벤트 콜백들을 담은 옵션 객체
 * @returns 연결 상태와 각종 액션 함수들
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {

  // options에서 필요한 값들을 구조 분해로 꺼냅니다.
  const {
    token,
    onMessage,
    onMessageUpdate,
    onMessageDelete,
    onTyping,
    onReaction,
    onConversationMessage,
    onJoinRequest,
    onUserRemoved,
    onMemberUpdated,
    onNotification,
    onJoinApproved,
    onStatusChange
  } = options;

  /**
   * isConnected: 현재 소켓 연결 상태를 나타내는 state입니다.
   *
   * useState란?
   * - 컴포넌트가 기억해야 하는 값을 관리합니다.
   * - 값이 바뀌면 컴포넌트가 자동으로 다시 렌더링됩니다.
   * - [현재값, 값을_바꾸는_함수] 형태로 반환됩니다.
   *
   * 초기값은 false (아직 연결 전)
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * socketRef: Socket 인스턴스를 보관하는 ref입니다.
   *
   * useRef란?
   * - useState와 달리 값이 바뀌어도 리렌더링이 발생하지 않습니다.
   * - 렌더링 사이클과 무관하게 값을 유지하고 싶을 때 사용합니다.
   * - .current 속성으로 값에 접근합니다.
   *
   * 소켓을 useState로 관리하면 값이 바뀔 때마다 불필요한 리렌더링이 발생하므로
   * useRef를 사용합니다. 초기값은 null (아직 연결 전).
   */
  const socketRef = useRef<Socket | null>(null);

  /**
   * callbacksRef: 콜백 함수들을 ref에 저장하는 "Stable Ref 패턴"입니다.
   *
   * ❓ 왜 콜백을 ref에 넣을까요?
   *
   * 문제 상황:
   * - useEffect 내부에서 onMessage 같은 콜백을 직접 참조하면,
   *   컴포넌트가 리렌더링될 때마다 콜백 함수가 새로 만들어집니다.
   * - 그러면 useEffect의 의존성 배열([token])에 콜백을 추가해야 하고,
   *   콜백이 바뀔 때마다 소켓을 재연결하는 문제가 생깁니다.
   *
   * 해결책 (Stable Ref 패턴):
   * - 콜백들을 ref에 담아두면, ref 자체는 항상 같은 객체라 소켓 재연결이 없습니다.
   * - ref.current만 최신 콜백으로 교체되므로 항상 최신 함수를 호출할 수 있습니다.
   *
   * 아래 한 줄이 핵심입니다:
   *   callbacksRef.current = { ... }
   * → 매 렌더링마다 ref.current를 최신 콜백으로 갱신합니다.
   */
  const callbacksRef = useRef(options);

  // 매 렌더링마다 ref.current를 최신 콜백들로 덮어씁니다.
  // 이렇게 하면 이벤트 핸들러에서 항상 최신 콜백을 사용할 수 있습니다.
  callbacksRef.current = {
    token,
    onMessage,
    onMessageUpdate,
    onMessageDelete,
    onTyping,
    onReaction,
    onConversationMessage,
    onJoinRequest,
    onUserRemoved,
    onMemberUpdated,
    onNotification,
    onJoinApproved,
    onStatusChange
  };

  // ──────────────────────────────────────────────
  // 소켓 연결 및 이벤트 등록 (useEffect)
  // ──────────────────────────────────────────────

  /**
   * useEffect: 컴포넌트가 화면에 나타난 후 실행되는 사이드 이펙트입니다.
   *
   * 실행 시점:
   * - 처음 컴포넌트가 마운트(화면에 등장)될 때 실행
   * - 두 번째 인자(의존성 배열 [token])의 값이 바뀔 때마다 재실행
   *   → 토큰이 바뀌면 기존 소켓을 끊고 새로 연결합니다.
   *
   * return 함수 (클린업):
   * - 컴포넌트가 언마운트(화면에서 사라짐)될 때 자동 실행됩니다.
   * - 여기서 socket.disconnect()를 호출해 메모리 누수를 방지합니다.
   */
  useEffect(() => {

    /**
     * Socket.IO 서버에 연결합니다.
     *
     * window.location.origin: 현재 브라우저의 도메인+포트
     * 예: 'http://localhost:3000' 또는 'https://mychat.com'
     *
     * 연결 옵션:
     * - auth.token : 서버의 JWT 인증 미들웨어에 전달됩니다.
     * - transports : 통신 방식. websocket을 먼저 시도하고 실패 시 polling으로 대체
     *   (polling: HTTP로 주기적으로 요청하는 방식. 느리지만 호환성이 높음)
     * - reconnection: 연결이 끊기면 자동으로 재연결 시도
     * - reconnectionAttempts: 최대 재시도 횟수 (10회)
     * - reconnectionDelay: 재시도 간격 (1000ms = 1초)
     */
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    /**
     * 'connect': 서버와 성공적으로 연결됐을 때 발생합니다.
     * isConnected를 true로 바꿔 UI에서 연결 상태를 표시할 수 있게 합니다.
     * (예: 초록색 점 표시, "연결됨" 텍스트 등)
     */
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    /**
     * 'disconnect': 연결이 끊어졌을 때 발생합니다.
     * 네트워크 문제, 서버 재시작, 브라우저 탭 전환 등으로 발생할 수 있습니다.
     * reconnection: true 설정이 있으면 Socket.IO가 자동으로 재연결을 시도합니다.
     */
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // ── 서버에서 오는 이벤트 수신 ──────────────────

    /**
     * 'message_new': 채널에 새 메시지가 올 때 서버가 보내는 이벤트입니다.
     *
     * callbacksRef.current.onMessage?.(message) 해석:
     * - callbacksRef.current.onMessage : ref에서 최신 콜백을 꺼냄
     * - ?.() : optional chaining. 콜백이 undefined가 아닐 때만 호출
     *   (onMessage를 전달하지 않은 경우 에러 없이 그냥 무시됩니다)
     *
     * ref를 통해 호출하므로 컴포넌트가 리렌더링돼도 항상 최신 콜백이 실행됩니다.
     */
    socket.on('message_new', (message) => {
      callbacksRef.current.onMessage?.(message);
    });

    /**
     * 'conversation_message_new': DM(1:1 또는 그룹) 새 메시지 이벤트입니다.
     * 채널 메시지와 별도로 처리해서 DM과 채널 UI를 독립적으로 관리할 수 있습니다.
     */
    socket.on('conversation_message_new', (message) => {
      callbacksRef.current.onConversationMessage?.(message);
    });

    /**
     * 'message_update': 기존 메시지가 수정됐을 때 발생하는 이벤트입니다.
     * 수정된 메시지 전체 객체가 전달되므로, 컴포넌트에서 해당 메시지를 찾아 교체합니다.
     * 예: setMessages(prev => prev.map(m => m.id === message.id ? message : m))
     */
    socket.on('message_update', (message) => {
      callbacksRef.current.onMessageUpdate?.(message);
    });

    /**
     * 'message_delete': 메시지가 삭제됐을 때 발생하는 이벤트입니다.
     * { messageId } 만 전달되므로, 컴포넌트에서 해당 ID의 메시지를 목록에서 제거합니다.
     * 예: setMessages(prev => prev.filter(m => m.id !== data.messageId))
     */
    socket.on('message_delete', (data) => {
      callbacksRef.current.onMessageDelete?.(data);
    });

    /**
     * 'user_typing': 다른 사용자의 타이핑 상태가 바뀔 때 발생하는 이벤트입니다.
     * data.isTyping이 true면 "OOO님이 입력 중..." 표시를 보여주고,
     * false면 해당 표시를 숨깁니다.
     *
     * ⚠️ 주의: 본인이 보낸 typing_start/stop은 서버가 socket.to()로 전송해서
     *    본인에게는 이 이벤트가 오지 않습니다. (socket.to = 자기 자신 제외 전송)
     */
    socket.on('user_typing', (data) => {
      callbacksRef.current.onTyping?.(data);
    });

    /**
     * 'reaction_added': 메시지에 이모지 반응이 추가됐을 때 발생합니다.
     * onReaction 콜백을 reaction_added와 reaction_removed가 공유합니다.
     * 콜백 내부에서 data의 타입이나 구조로 구분해서 처리해야 합니다.
     */
    socket.on('reaction_added', (data) => {
      callbacksRef.current.onReaction?.(data);
    });

    /**
     * 'reaction_removed': 이모지 반응이 제거됐을 때 발생합니다.
     * reaction_added와 같은 onReaction 콜백을 공유합니다.
     */
    socket.on('reaction_removed', (data) => {
      callbacksRef.current.onReaction?.(data);
    });

    /**
     * 'user_removed': 자신이 워크스페이스에서 추방되었을 때 발생합니다.
     */
    socket.on('user_removed', (data) => {
      callbacksRef.current.onUserRemoved?.(data);
    });

    /**
     * 'member_updated': 워크스페이스 멤버 목록에 변동이 생겼을 때 발생합니다.
     */
    socket.on('member_updated', (data) => {
      callbacksRef.current.onMemberUpdated?.(data);
    });

    /**
     * 'notification_new': 자신에게 새로운 알림이 왔을 때 발생합니다.
     */
    socket.on('notification_new', (data) => {
      callbacksRef.current.onNotification?.(data);
    });

    /**
     * 'join_request_new': 새로운 팀 가입 신청이 왔을 때 발생합니다. (오너 전용)
     */
    socket.on('join_request_new', (data) => {
      callbacksRef.current.onJoinRequest?.(data);
    });

    /**
     * 'join_approved': 자신의 팀 가입 신청이 승인되었을 때 발생합니다.
     */
    socket.on('join_approved', (data) => {
      callbacksRef.current.onJoinApproved?.(data);
    });

    socket.on('status_changed', (data) => {
      callbacksRef.current.onStatusChange?.(data);
    });

    /**
     * socketRef에 소켓 인스턴스를 저장합니다.
     * 이렇게 해야 useEffect 바깥의 함수들(joinChannel 등)에서 소켓에 접근할 수 있습니다.
     * ref이므로 이 값이 바뀌어도 리렌더링이 발생하지 않습니다.
     */
    socketRef.current = socket;

    /**
     * 클린업(Cleanup) 함수: 컴포넌트가 언마운트되거나 token이 바뀔 때 실행됩니다.
     *
     * 왜 필요한가?
     * - 클린업 없이 컴포넌트가 사라지면 소켓 연결이 계속 열려있어 메모리 누수 발생
     * - token이 바뀌면 기존 연결을 끊고 새 토큰으로 재연결해야 하므로 기존 소켓 정리 필요
     *
     * socket.disconnect(): 서버에 연결 종료를 알리고 소켓을 닫습니다.
     * 서버의 'disconnect' 이벤트가 발생하고, userPresence가 offline으로 업데이트됩니다.
     */
    return () => {
      socket.disconnect();
    };

  }, [token]);
  // ↑ 의존성 배열: token이 바뀔 때만 이 useEffect를 재실행합니다.
  //   빈 배열([])이면 처음 마운트 시 한 번만 실행.
  //   콜백 함수들은 callbacksRef 패턴으로 처리했기 때문에 여기에 넣지 않아도 됩니다.

  // ──────────────────────────────────────────────
  // 액션 함수들 (useCallback으로 메모이제이션)
  // ──────────────────────────────────────────────

  /**
   * useCallback이란?
   * - 함수를 메모이제이션(캐싱)합니다.
   * - 의존성 배열이 빈 배열([])이면, 이 함수는 컴포넌트가 살아있는 동안
   *   딱 한 번만 만들어집니다.
   *
   * 왜 사용하나요?
   * - 이 훅의 반환값을 받는 컴포넌트에 props로 전달할 때,
   *   매 렌더링마다 새 함수가 생성되면 불필요한 자식 리렌더링이 발생합니다.
   * - useCallback으로 함수를 고정하면 자식 컴포넌트가 불필요하게 리렌더링되지 않습니다.
   *
   * socketRef.current?.emit(...)의 ?. 해석:
   * - Optional chaining: socketRef.current가 null이 아닐 때만 emit을 호출
   * - 소켓이 아직 연결 전이거나 끊긴 상태라면 에러 없이 그냥 무시됩니다.
   */

  // ── 채널 입퇴장 ──────────────────────────────

  /**
   * joinChannel: 서버의 'join_channel' 이벤트를 발생시킵니다.
   * 서버에서 권한을 확인하고 채널 룸에 추가해줍니다.
   * 이 함수 호출 후부터 해당 채널의 메시지를 수신할 수 있습니다.
   */
  const joinChannel = useCallback((channelId: number) => {
    socketRef.current?.emit('join_channel', { channelId });
  }, []); // 의존성 없음: 마운트 시 한 번만 생성

  /**
   * leaveChannel: 채널에서 나갑니다.
   * 이 함수 호출 후에는 해당 채널의 이벤트를 수신하지 않습니다.
   * 페이지 이동이나 채널 전환 시 이전 채널 구독을 정리할 때 사용합니다.
   */
  const leaveChannel = useCallback((channelId: number) => {
    socketRef.current?.emit('leave_channel', { channelId });
  }, []);

  /**
   * joinConversation: DM 대화방에 입장합니다.
   * 채널과 동일하지만 conversationId를 사용합니다.
   */
  const joinConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('join_conversation', { conversationId });
  }, []);

  /**
   * leaveConversation: DM 대화방에서 나갑니다.
   */
  const leaveConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('leave_conversation', { conversationId });
  }, []);

  // ── 팀(워크스페이스) 입퇴장 ──────────────────

  /**
   * joinTeam: 팀(워크스페이스) 룸에 입장합니다.
   * 팀 전체 알림(멤버 변동 등)을 수신하기 위해 필요합니다.
   */
  const joinTeam = useCallback((teamId: number) => {
    socketRef.current?.emit('join_team', { teamId });
  }, []);

  /**
   * leaveTeam: 팀 룸에서 나갑니다.
   */
  const leaveTeam = useCallback((teamId: number) => {
    socketRef.current?.emit('leave_team', { teamId });
  }, []);

  // ── 메시지 전송/수정/삭제 ──────────────────────

  /**
   * sendMessage: 채널에 메시지를 전송합니다.
   *
   * @param channelId - 전송할 채널 ID
   * @param content   - 메시지 내용
   * @param type      - 메시지 타입 (생략 시 서버에서 'text'로 기본 처리)
   * @param parentId  - 스레드 답글일 경우 부모 메시지 ID
   */
  const sendMessage = useCallback((
    channelId: number,
    content: string,
    type?: string,
    parentId?: number
  ) => {
    socketRef.current?.emit('send_message', { channelId, content, type, parentId });
  }, []);

  /**
   * sendConversationMessage: DM 메시지를 전송합니다.
   * 채널 메시지와 달리 conversationId를 사용합니다.
   */
  const sendConversationMessage = useCallback((
    conversationId: number,
    content: string
  ) => {
    socketRef.current?.emit('send_conversation_message', { conversationId, content });
  }, []);

  /**
   * updateMessage: 자신이 보낸 메시지를 수정합니다.
   * 서버에서 본인 메시지인지 검증 후 처리됩니다.
   */
  const updateMessage = useCallback((messageId: number, content: string) => {
    socketRef.current?.emit('update_message', { messageId, content });
  }, []);

  /**
   * deleteMessage: 메시지를 삭제합니다.
   * 서버에서 본인 메시지이거나 관리자 권한이 있는 경우만 처리됩니다.
   * Soft delete 방식이라 실제로 삭제되지는 않고 "[deleted]"로 표시됩니다.
   */
  const deleteMessage = useCallback((messageId: number) => {
    socketRef.current?.emit('delete_message', { messageId });
  }, []);

  // ── 타이핑 표시 ──────────────────────────────

  /**
   * startTyping: 타이핑 시작을 서버에 알립니다.
   * 서버는 같은 채널의 다른 사용자들에게 "OOO님이 입력 중..." 이벤트를 전달합니다.
   *
   * 사용 패턴 예시:
   *   <input
   *     onKeyDown={() => startTyping(channelId)}
   *     onBlur={() => stopTyping(channelId)}
   *   />
   *
   * ⚠️ 주의: 키를 누를 때마다 이벤트가 발생하면 서버 부하가 크므로,
   *    실제로는 debounce(일정 시간 기다렸다가 한 번만 전송)를 함께 사용하는 것이 좋습니다.
   */
  const startTyping = useCallback((channelId: number) => {
    socketRef.current?.emit('typing_start', { channelId });
  }, []);

  /**
   * stopTyping: 타이핑 중지를 서버에 알립니다.
   * 메시지 전송 후, 입력창에서 포커스가 빠질 때(onBlur), 또는
   * 일정 시간 키 입력이 없을 때 호출합니다.
   */
  const stopTyping = useCallback((channelId: number) => {
    socketRef.current?.emit('typing_stop', { channelId });
  }, []);

  // ── 이모지 반응은 이제 Axios와 WebSocket 브로드캐스트를 통해 처리됩니다. (시니어 개발자 관점: 아키텍처 단순화)


  // ── 읽음 처리 ────────────────────────────────

  /**
   * readMessage: 메시지를 읽었음을 서버에 알립니다.
   * 서버는 DB에 읽음 기록을 저장하고, 안 읽은 메시지 뱃지 수를 갱신합니다.
   *
   * 일반적으로 사용자가 채널에 입장하거나 스크롤하면서 메시지가 보일 때 호출합니다.
   * (Intersection Observer API와 함께 사용하면 "화면에 보인 메시지만" 읽음 처리 가능)
   *
   * @param channelId - 채널 ID (서버의 lastReadAt 업데이트에 필요)
   * @param messageId - 읽은 메시지 ID
   */
  const readMessage = useCallback((channelId: number, messageId: number) => {
    socketRef.current?.emit('read_message', { channelId, messageId });
  }, []);

  // ──────────────────────────────────────────────
  // 반환값
  // ──────────────────────────────────────────────

  /**
   * 훅을 사용하는 컴포넌트에서 필요한 값과 함수들을 반환합니다.
   *
   * 사용 예시:
   *   const { isConnected, sendMessage, joinChannel } = useWebSocket({
   *     token,
   *     onMessage: (msg) => setMessages(prev => [...prev, msg]),
   *     onTyping: (data) => setTypingUsers(data),
   *   });
   *
   *   useEffect(() => {
   *     joinChannel(currentChannelId);
   *     return () => leaveChannel(currentChannelId);
   *   }, [currentChannelId]);
   */
  return {
    isConnected,       // 연결 상태 (UI에서 연결 표시등 등에 활용)
    joinChannel,
    leaveChannel,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendConversationMessage,
    updateMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    readMessage,
    joinTeam,
    leaveTeam,
  };
}