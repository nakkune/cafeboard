/**
 * ============================================================
 * 📨 useMessages - 채널 메시지 관리 커스텀 훅
 * ============================================================
 *
 * 이 훅이 하는 일:
 * - HTTP REST API를 통해 메시지를 불러오고, 전송/수정/삭제합니다.
 * - 이전에 만든 useWebSocket과의 역할 분담:
 *   ┌─────────────────┬──────────────────────────────────────┐
 *   │  useMessages    │ REST API (HTTP 요청/응답)             │
 *   │                 │ → 메시지 목록 조회, CRUD 작업        │
 *   ├─────────────────┼──────────────────────────────────────┤
 *   │  useWebSocket   │ WebSocket (실시간 양방향 통신)        │
 *   │                 │ → 실시간 메시지 수신, 타이핑 표시    │
 *   └─────────────────┴──────────────────────────────────────┘
 *
 * 실제 사용 흐름:
 * 1. 채널 입장 시 useMessages로 기존 메시지 목록을 한 번에 가져옴
 * 2. 이후 새 메시지는 useWebSocket의 onMessage 콜백으로 실시간 수신
 * 3. 메시지 전송/수정/삭제는 useMessages의 함수로 처리
 * ============================================================
 */

// React 훅 가져오기
// useState   : 컴포넌트 상태값 관리 (메시지 목록, 로딩 여부, 에러)
// useEffect  : 컴포넌트 마운트/업데이트 시 사이드 이펙트 처리
// useCallback: 함수 메모이제이션 (불필요한 재생성 방지)
import { useState, useEffect, useCallback } from 'react';

// axios: HTTP 요청을 쉽게 보낼 수 있는 라이브러리입니다.
// 기본 fetch API보다 에러 처리, 인터셉터, 자동 JSON 변환 등이 편리합니다.
import axios from 'axios';

// API 기본 URL 상수입니다.
// 모든 API 요청 앞에 이 경로가 붙습니다.
// '/api'는 상대경로로, 현재 도메인 기준입니다. (예: http://localhost:3000/api)
// 상수로 분리해두면 나중에 URL이 바뀌어도 이 한 줄만 수정하면 됩니다.
const API_URL = '/api';

// ============================================================
// 타입 정의
// ============================================================

/**
 * Message: 메시지 한 개의 데이터 구조를 정의합니다.
 *
 * 서버에서 메시지를 받아올 때 이 형태로 옵니다.
 * TypeScript가 이 타입을 알면 오탈자나 없는 속성 접근을 컴파일 단계에서 잡아줍니다.
 */
interface Message {
  id: number;           // 메시지 고유 ID (DB의 primary key)
  content: string;      // 메시지 내용

  // 중첩 객체: 메시지를 작성한 사용자 정보
  author: {
    id: number;
    nickname: string;
    profileImage: string | null; // 프로필 이미지 URL (없으면 null)
  };

  createdAt: string;         // 작성 시각 (ISO 8601 문자열, 예: "2024-01-15T09:30:00.000Z")
  isEdited: boolean;         // 수정 여부 (true면 UI에 "(수정됨)" 표시)
  parentId: number | null;   // 스레드 답글이면 부모 메시지 ID, 아니면 null

  // ?: 선택적 속성. 서버가 항상 보내주지 않을 수 있음
  // _count: Prisma가 관계 데이터 개수를 반환할 때 사용하는 관례적 필드명
  _count?: {
    replies: number; // 이 메시지의 스레드 답글 개수 (예: "답글 3개" 표시용)
  };
}

/**
 * UseMessagesOptions: 훅에 전달하는 옵션 타입
 *
 * channelId: null을 허용하는 이유 →
 *   컴포넌트가 처음 렌더링될 때는 아직 채널이 선택 안 됐을 수 있습니다.
 *   null이면 메시지를 불러오지 않도록 내부에서 처리합니다.
 */
interface UseMessagesOptions {
  channelId: number | null; // 현재 선택된 채널 ID (없으면 null)
  token: string;            // JWT 인증 토큰
}

/**
 * UseMessagesReturn: 훅이 반환하는 값들의 타입
 *
 * 이 인터페이스를 보면 "이 훅이 무엇을 제공하는지" 한눈에 파악할 수 있습니다.
 * 일종의 훅의 사용 설명서 역할을 합니다.
 */
interface UseMessagesReturn {
  messages: Message[];        // 현재 채널의 메시지 목록
  loading: boolean;           // 메시지를 불러오는 중이면 true (로딩 스피너 표시용)
  error: string | null;       // 에러 메시지 (없으면 null)
  fetchMessages: () => Promise<void>;                                          // 메시지 목록 새로고침
  sendMessage: (content: string, parentId?: number) => Promise<Message | null>; // 메시지 전송
  updateMessage: (messageId: number, content: string) => Promise<void>;        // 메시지 수정
  deleteMessage: (messageId: number) => Promise<void>;                         // 메시지 삭제
  addReaction: (messageId: number, emoji: string) => Promise<void>;            // 이모지 반응 추가
  removeReaction: (messageId: number, emoji: string) => Promise<void>;         // 이모지 반응 제거
}

// ============================================================
// 훅 본체
// ============================================================

/**
 * useMessages: 채널 메시지 CRUD를 담당하는 커스텀 훅
 *
 * @param channelId - 메시지를 불러올 채널 ID
 * @param token     - API 인증에 사용할 JWT 토큰
 * @returns 메시지 상태와 액션 함수들
 */
export function useMessages({ channelId, token }: UseMessagesOptions): UseMessagesReturn {

  // ──────────────────────────────────────────────
  // 상태(State) 선언
  // ──────────────────────────────────────────────

  /**
   * messages: 현재 채널의 메시지 목록입니다.
   * 초기값은 빈 배열 [].
   * <Message[]>는 "Message 타입의 배열"이라고 TypeScript에게 알려줍니다.
   */
  const [messages, setMessages] = useState<Message[]>([]);

  /**
   * loading: API 요청 중 여부입니다.
   * true일 때 UI에서 로딩 스피너를 보여주고 버튼을 비활성화하는 데 활용합니다.
   */
  const [loading, setLoading] = useState(false);

  /**
   * error: 가장 최근 에러 메시지입니다.
   * 에러가 없으면 null, 있으면 에러 문자열을 담습니다.
   * string | null 타입으로 "없음"을 null로 명확히 표현합니다.
   */
  const [error, setError] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // 헬퍼 함수
  // ──────────────────────────────────────────────

  /**
   * getAuthHeader: 모든 API 요청에 공통으로 들어가는 인증 헤더를 반환합니다.
   *
   * Bearer 토큰 방식:
   * - Authorization 헤더에 "Bearer {토큰}" 형태로 토큰을 전달합니다.
   * - 서버는 이 헤더를 보고 "누가 요청했는지" 인증합니다.
   * - Bearer는 "이 토큰을 가진 사람에게 접근 권한을 줘라"는 의미입니다.
   *
   * 함수로 만든 이유:
   * - 모든 API 호출마다 { headers: { Authorization: ... } }를 반복 작성하는 대신
   *   getAuthHeader()를 호출하면 됩니다. (DRY 원칙: Don't Repeat Yourself)
   *
   * ⚠️ 개선 포인트: 이 함수는 token이 바뀔 때마다 새로 생성됩니다.
   *    useCallback으로 감싸거나, axios 인스턴스에 인터셉터로 등록하면 더 효율적입니다.
   */
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // ──────────────────────────────────────────────
  // 메시지 목록 조회
  // ──────────────────────────────────────────────

  /**
   * fetchMessages: 현재 채널의 메시지 목록을 서버에서 불러옵니다.
   *
   * useCallback으로 감싼 이유:
   * - 이 함수를 useEffect의 의존성 배열에 넣어야 하는데,
   *   함수를 그냥 선언하면 매 렌더링마다 새 함수가 생성되어
   *   useEffect가 무한 루프에 빠집니다.
   * - useCallback은 channelId나 token이 바뀔 때만 함수를 새로 만들어
   *   무한 루프를 방지합니다.
   *
   * async/await:
   * - 비동기 함수임을 나타냅니다.
   * - await가 붙은 줄은 결과가 올 때까지 기다린 후 다음 줄을 실행합니다.
   * - 동기 코드처럼 읽히지만 실제로는 비동기로 동작합니다.
   */
  const fetchMessages = useCallback(async () => {
    // channelId가 null이면 (아직 채널 미선택) 아무것도 하지 않고 종료
    if (!channelId) return;

    setLoading(true);   // 로딩 시작: UI에 스피너 표시
    setError(null);     // 이전 에러 초기화 (새 요청 시작 전 에러 지우기)

    try {
      /**
       * axios.get(): HTTP GET 요청을 보냅니다.
       * URL: /api/channels/42/messages (channelId가 42인 경우)
       * 두 번째 인자: 요청 옵션 (여기선 인증 헤더)
       *
       * res.data: axios가 응답 JSON을 자동으로 파싱한 결과
       * res.data.messages: 서버가 { messages: [...] } 형태로 반환한다고 가정
       * || []: messages가 undefined이면 빈 배열로 대체 (안전장치)
       */
      const res = await axios.get(
        `${API_URL}/channels/${channelId}/messages`,
        getAuthHeader()
      );
      setMessages(res.data.messages || []);

    } catch (err: any) {
      /**
       * 에러 처리:
       * err.response?.data?.error : 서버가 보낸 에러 메시지 (예: "채널을 찾을 수 없습니다")
       * || 'Failed to fetch messages' : 서버 에러 메시지가 없으면 기본 메시지 사용
       *
       * ?.은 Optional Chaining: 중간 값이 null/undefined면 에러 없이 undefined 반환
       * 예: err.response가 null이면 err.response?.data는 undefined (에러 없음)
       */
      setError(err.response?.data?.error || 'Failed to fetch messages');

    } finally {
      /**
       * finally 블록: try/catch 결과와 무관하게 항상 실행됩니다.
       * 성공이든 실패든 로딩은 끝났으므로 반드시 false로 돌려놓아야 합니다.
       * finally가 없으면 에러 발생 시 로딩이 영원히 true로 남을 수 있습니다.
       */
      setLoading(false);
    }
  }, [channelId, token]);
  // ↑ channelId나 token이 바뀔 때만 함수를 새로 생성합니다.

  /**
   * useEffect: channelId가 바뀔 때마다 메시지를 자동으로 다시 불러옵니다.
   *
   * 동작 시점:
   * - 처음 컴포넌트가 마운트될 때
   * - fetchMessages 함수가 바뀔 때 (= channelId나 token이 바뀔 때)
   *
   * fetchMessages를 의존성으로 넣은 이유:
   * - fetchMessages 자체가 channelId, token을 의존하고 있어서
   *   채널이 바뀌면 fetchMessages도 새로 만들어지고,
   *   그러면 이 useEffect도 다시 실행되어 새 채널 메시지를 불러옵니다.
   */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ──────────────────────────────────────────────
  // 메시지 전송
  // ──────────────────────────────────────────────

  /**
   * sendMessage: 새 메시지를 서버에 전송하고 목록에 추가합니다.
   *
   * @param content  - 메시지 내용
   * @param parentId - 스레드 답글이면 부모 메시지 ID (일반 메시지면 생략)
   * @returns 성공 시 생성된 Message 객체, 실패 시 null
   *
   * 반환값을 Message | null로 한 이유:
   * - 호출한 쪽에서 전송 성공 여부를 확인하고 추가 처리를 할 수 있습니다.
   * - 예: 전송 성공 시 입력창 초기화, 실패 시 입력 내용 유지
   *
   * ⚠️ 이 함수는 useCallback으로 감싸져 있지 않습니다.
   *    getAuthHeader를 내부에서 사용하기 때문인데,
   *    useCallback으로 감싸면 getAuthHeader를 의존성에 추가해야 해서 복잡해집니다.
   *    성능이 중요한 경우 useCallback + useMemo 조합으로 개선할 수 있습니다.
   */
  const sendMessage = async (content: string, parentId?: number): Promise<Message | null> => {
    if (!channelId) return null; // 채널 미선택 시 전송 불가

    try {
      /**
       * axios.post(): HTTP POST 요청 (새 데이터 생성)
       * 인자 순서: (URL, 요청 본문 데이터, 옵션)
       *
       * { content, parentId }: 서버에 전달할 메시지 데이터
       * parentId가 undefined이면 서버에서 null로 처리합니다.
       */
      const res = await axios.post(
        `${API_URL}/channels/${channelId}/messages`,
        { content, parentId },
        getAuthHeader()
      );

      /**
       * Optimistic Update(낙관적 업데이트):
       * 서버 응답이 오면 즉시 로컬 상태에 새 메시지를 추가합니다.
       *
       * prev => [res.data, ...prev] 해석:
       * - prev: 현재 messages 배열
       * - [res.data, ...prev]: 새 메시지를 맨 앞에 추가한 새 배열
       * - ...prev: 스프레드 연산자로 기존 배열 요소들을 펼침
       *
       * 새 메시지를 앞에 추가하는 이유:
       * 서버에서 최신순으로 정렬해서 주는 경우 맨 앞에 추가해야 UI 순서가 맞습니다.
       * (오래된 순이면 push나 [...prev, res.data] 형태로 바꿔야 합니다.)
       */
      setMessages(prev => [res.data, ...prev]);
      return res.data; // 생성된 메시지 객체 반환

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
      return null; // 실패 시 null 반환
    }
  };

  // ──────────────────────────────────────────────
  // 메시지 수정
  // ──────────────────────────────────────────────

  /**
   * updateMessage: 기존 메시지 내용을 수정합니다.
   *
   * @param messageId - 수정할 메시지의 ID
   * @param content   - 수정된 내용
   *
   * 서버에서 수정된 메시지 전체를 반환하면,
   * 로컬 상태에서 해당 메시지를 새 데이터로 교체합니다.
   */
  const updateMessage = async (messageId: number, content: string) => {
    try {
      /**
       * axios.put(): HTTP PUT 요청 (기존 데이터 전체 교체)
       * PATCH와의 차이: PUT은 전체 교체, PATCH는 일부만 수정
       * 여기선 content만 바꾸지만 서버 설계에 따라 PUT을 사용합니다.
       */
      const res = await axios.put(
        `${API_URL}/messages/${messageId}`,
        { content },
        getAuthHeader()
      );

      /**
       * 메시지 목록에서 수정된 메시지만 교체합니다.
       *
       * prev.map(m => m.id === messageId ? res.data : m) 해석:
       * - 배열의 모든 요소를 순회하며 (map)
       * - ID가 일치하는 메시지는 서버에서 받은 최신 데이터로 교체
       * - 나머지는 그대로 유지
       * - 결과: 수정된 메시지만 바뀐 새 배열
       *
       * 이렇게 하면 전체 목록을 다시 불러오지 않고도 수정 사항을 즉시 반영합니다.
       */
      setMessages(prev => prev.map(m => m.id === messageId ? res.data : m));

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update message');
    }
  };

  // ──────────────────────────────────────────────
  // 메시지 삭제
  // ──────────────────────────────────────────────

  /**
   * deleteMessage: 메시지를 삭제합니다.
   *
   * @param messageId - 삭제할 메시지의 ID
   *
   * 서버는 Soft Delete(isDeleted: true로 표시)를 사용하지만,
   * 클라이언트에서는 목록에서 완전히 제거합니다.
   * → 화면에서 "[삭제된 메시지]"를 보여줄지, 아예 숨길지는 UX 정책에 따라 다릅니다.
   */
  const deleteMessage = async (messageId: number) => {
    try {
      // axios.delete(): HTTP DELETE 요청 (데이터 삭제)
      await axios.delete(`${API_URL}/messages/${messageId}`, getAuthHeader());

      /**
       * 삭제된 메시지를 목록에서 제거합니다.
       *
       * prev.filter(m => m.id !== messageId) 해석:
       * - 배열에서 조건을 만족하는 요소만 남기고 (filter)
       * - ID가 일치하지 않는(삭제 대상이 아닌) 메시지만 유지
       * - 결과: 삭제된 메시지가 빠진 새 배열
       */
      setMessages(prev => prev.filter(m => m.id !== messageId));

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  };

  // ──────────────────────────────────────────────
  // 이모지 반응
  // ──────────────────────────────────────────────

  /**
   * addReaction: 메시지에 이모지 반응을 추가합니다.
   *
   * @param messageId - 반응을 추가할 메시지 ID
   * @param emoji     - 이모지 문자열 (예: "👍", "❤️")
   *
   * ⚠️ 현재 구현의 한계:
   * 서버에 요청만 보내고 로컬 상태를 업데이트하지 않습니다.
   * 실시간 반응 업데이트는 useWebSocket의 onReaction 콜백을 통해 처리됩니다.
   * (서버가 WebSocket으로 reaction_added 이벤트를 broadcast하기 때문)
   */
  const addReaction = async (messageId: number, emoji: string) => {
    try {
      // POST 요청으로 반응 추가
      await axios.post(
        `${API_URL}/messages/${messageId}/reactions`,
        { emoji },
        getAuthHeader()
      );
      // 로컬 상태 업데이트 없음: WebSocket 이벤트로 처리됨

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add reaction');
    }
  };

  /**
   * removeReaction: 메시지의 이모지 반응을 제거합니다.
   *
   * @param messageId - 반응을 제거할 메시지 ID
   * @param emoji     - 제거할 이모지 문자열
   *
   * encodeURIComponent(emoji)를 사용하는 이유:
   * - URL에 이모지를 그대로 넣으면 "👍"가 특수문자로 처리되어 요청이 깨집니다.
   * - encodeURIComponent는 이모지를 URL 안전한 형태로 인코딩합니다.
   * - 예: "👍" → "%F0%9F%91%8D"
   *
   * DELETE 요청에 body 대신 URL에 이모지를 넣는 방식을 사용합니다.
   * (일부 서버/프록시에서 DELETE 요청의 body를 지원하지 않는 경우가 있기 때문)
   */
  const removeReaction = async (messageId: number, emoji: string) => {
    try {
      await axios.delete(
        `${API_URL}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
        getAuthHeader()
      );
      // 로컬 상태 업데이트 없음: WebSocket 이벤트로 처리됨

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove reaction');
    }
  };

  // ──────────────────────────────────────────────
  // 반환값
  // ──────────────────────────────────────────────

  /**
   * 훅을 사용하는 컴포넌트에서 필요한 모든 상태와 함수를 반환합니다.
   *
   * 사용 예시:
   *   const {
   *     messages,      // 메시지 목록 렌더링
   *     loading,       // 로딩 스피너 표시
   *     error,         // 에러 메시지 표시
   *     sendMessage,   // 전송 버튼 클릭 시
   *     deleteMessage, // 삭제 버튼 클릭 시
   *   } = useMessages({ channelId: 42, token: 'eyJ...' });
   *
   *   if (loading) return <Spinner />;
   *   if (error) return <ErrorBanner message={error} />;
   *   return messages.map(msg => <MessageItem key={msg.id} message={msg} />);
   */
  return {
    messages,        // 메시지 배열 (UI에서 map으로 렌더링)
    loading,         // 로딩 중 여부 (스피너, 버튼 비활성화 등에 활용)
    error,           // 에러 문자열 (에러 배너 등에 활용)
    fetchMessages,   // 수동 새로고침이 필요할 때 호출
    sendMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
  };
}