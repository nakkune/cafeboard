/**
 * ============================================================
 * 🟢 usePresence - 사용자 온라인 상태(Presence) 관리 커스텀 훅
 * ============================================================
 *
 * Presence(프레즌스)란?
 * - 사용자가 현재 온라인인지, 자리를 비웠는지 등을 나타내는 상태입니다.
 * - 슬랙의 초록색/노란색/빨간색/회색 점이 바로 Presence입니다.
 *
 * 상태 종류:
 *   🟢 online  - 현재 접속 중
 *   🟡 away    - 자리 비움 (일정 시간 비활동 시 자동 전환)
 *   🔴 busy    - 방해 금지
 *   ⚫ offline - 오프라인
 *
 * 이 훅이 하는 일:
 * 1. 팀 전체 멤버의 Presence 목록을 불러옵니다.
 * 2. 본인의 상태를 수동으로 변경합니다. (online/away/busy/offline)
 * 3. 브라우저의 네트워크 연결/끊김을 감지해 상태를 자동으로 변경합니다.
 *
 * 다른 훅과의 역할 분담:
 * ┌──────────────────┬─────────────────────────────────────────┐
 * │  usePresence     │ REST API로 상태 조회/변경               │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │  useWebSocket    │ 실시간으로 다른 사람 상태 변경 수신     │
 * │  (user_online /  │ (join_team 후 user_online 이벤트로      │
 * │   user_offline)  │  실시간 업데이트)                       │
 * └──────────────────┴─────────────────────────────────────────┘
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 모든 API 요청의 기본 경로입니다.
const API_URL = '/api';

// ============================================================
// 타입 정의
// ============================================================

/**
 * Presence: 사용자 한 명의 온라인 상태 정보 타입입니다.
 *
 * 'online' | 'away' | 'busy' | 'offline' 처럼 | 로 나열하는 것을
 * TypeScript에서 "유니온 타입(Union Type)"이라고 합니다.
 * 이 네 가지 문자열 외의 값은 컴파일 단계에서 에러로 잡아줍니다.
 */
interface Presence {
  id: number;                                          // 사용자 DB ID
  nickname: string;                                    // 닉네임
  name: string | null;                                 // 실명 (미입력 시 null)
  profileImage: string | null;                         // 프로필 이미지 URL (없으면 null)
  status: 'online' | 'away' | 'busy' | 'offline';     // 현재 상태 (4가지 중 하나만 가능)
  lastActiveAt: string | null;                         // 마지막 활동 시각 (오프라인일 때 "3분 전" 표시용)
}

/**
 * UsePresenceOptions: 훅에 전달하는 옵션 타입
 * useMessages, useWebSocket과 동일하게 token만 필요합니다.
 */
interface UsePresenceOptions {
  token: string; // JWT 인증 토큰
}

/**
 * UsePresenceReturn: 훅이 반환하는 값들의 타입
 */
interface UsePresenceReturn {
  teamPresence: Presence[];                           // 팀 전체 멤버의 Presence 목록
  loading: boolean;                                   // 데이터 로딩 중 여부
  error: string | null;                               // 에러 메시지
  fetchTeamPresence: (teamId: number) => Promise<void>; // 팀 Presence 목록 조회
  updateStatus: (status: string) => Promise<void>;    // 상태 수동 변경 (away, busy 등)
  setOnline: () => Promise<void>;                     // 온라인으로 변경
  setOffline: () => Promise<void>;                    // 오프라인으로 변경
}

// ============================================================
// 훅 본체
// ============================================================

/**
 * usePresence: 팀 멤버들의 온라인 상태를 관리하는 커스텀 훅
 *
 * @param token - API 인증에 사용할 JWT 토큰
 * @returns Presence 상태와 액션 함수들
 */
export function usePresence({ token }: UsePresenceOptions): UsePresenceReturn {

  // ──────────────────────────────────────────────
  // 상태(State) 선언
  // ──────────────────────────────────────────────

  /**
   * teamPresence: 팀 전체 멤버의 Presence 배열입니다.
   * 예: [
   *   { id: 1, nickname: '홍길동', status: 'online', ... },
   *   { id: 2, nickname: '김철수', status: 'away', ... },
   * ]
   */
  const [teamPresence, setTeamPresence] = useState<Presence[]>([]);

  // 로딩 상태: API 요청 중이면 true
  const [loading, setLoading] = useState(false);

  // 에러 메시지: 에러 없으면 null
  const [error, setError] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // 헬퍼 함수
  // ──────────────────────────────────────────────

  /**
   * getAuthHeader: 인증 헤더를 반환하는 헬퍼 함수입니다.
   * 모든 API 요청에 공통으로 사용됩니다.
   * Authorization: Bearer {토큰} 형식으로 서버에 전달됩니다.
   */
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // ──────────────────────────────────────────────
  // 팀 Presence 목록 조회
  // ──────────────────────────────────────────────

  /**
   * fetchTeamPresence: 특정 팀의 모든 멤버 Presence를 불러옵니다.
   *
   * @param teamId - 조회할 팀(워크스페이스)의 ID
   *
   * useCallback을 사용한 이유:
   * - 이 함수를 자식 컴포넌트에 props로 전달하거나
   *   useEffect 의존성으로 쓸 때 불필요한 재생성을 막기 위해서입니다.
   * - [token]: token이 바뀔 때만 함수를 새로 만듭니다.
   *
   * useMessages의 fetchMessages와 달리 teamId를 인자로 받는 이유:
   * - 한 사용자가 여러 팀에 속할 수 있어서, 팀 전환 시마다
   *   다른 teamId로 호출할 수 있게 매개변수로 받습니다.
   */
  const fetchTeamPresence = useCallback(async (teamId: number) => {
    setLoading(true);
    setError(null);

    try {
      // GET /api/teams/42/presence 형태로 요청
      const res = await axios.get(
        `${API_URL}/teams/${teamId}/presence`,
        getAuthHeader()
      );

      // 서버가 배열을 바로 반환하므로 res.data를 직접 저장
      // (useMessages는 res.data.messages 처럼 한 번 더 들어갔던 것과 차이 있음)
      setTeamPresence(res.data);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch presence');
    } finally {
      // 성공/실패 무관하게 로딩 종료
      setLoading(false);
    }
  }, [token]);

  // ──────────────────────────────────────────────
  // 상태 수동 변경
  // ──────────────────────────────────────────────

  /**
   * updateStatus: 본인의 상태를 원하는 값으로 변경합니다.
   * (away, busy 등 세부 상태 설정 시 사용)
   *
   * @param status - 변경할 상태 문자열 ('online' | 'away' | 'busy' | 'offline')
   *
   * ⚠️ 현재 구현의 한계:
   * 서버에만 요청하고 로컬 teamPresence 상태를 업데이트하지 않습니다.
   * → 변경 후 화면에 즉시 반영되지 않을 수 있습니다.
   * → setOnline/setOffline처럼 로컬 상태도 함께 업데이트하면 좋습니다.
   */
  const updateStatus = async (status: string) => {
    try {
      // PUT /api/presence 로 상태 변경 요청
      await axios.put(`${API_URL}/presence`, { status }, getAuthHeader());
      // TODO: 로컬 teamPresence에서 본인 상태도 업데이트 필요
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  // ──────────────────────────────────────────────
  // 온라인/오프라인 전환
  // ──────────────────────────────────────────────

  /**
   * setOnline: 본인 상태를 'online'으로 변경합니다.
   *
   * 서버 요청과 동시에 로컬 상태(teamPresence)도 즉시 업데이트합니다.
   * (Optimistic Update 패턴 - 서버 응답을 기다리지 않고 UI를 먼저 반영)
   *
   * ⚠️ 주요 버그: localStorage.getItem('userId') 사용
   * - localStorage에서 userId를 읽는 방식은 보안상 좋지 않습니다.
   * - userId를 훅의 옵션(UsePresenceOptions)으로 전달받는 것이 더 안전합니다.
   * - 또한 localStorage에 userId가 없으면 0으로 처리되어
   *   아무 유저도 업데이트되지 않는 조용한 버그가 발생합니다.
   *
   * 개선 방법:
   *   interface UsePresenceOptions {
   *     token: string;
   *     userId: number; // ← 추가
   *   }
   */
  const setOnline = async () => {
    try {
      // POST /api/presence/online 으로 온라인 상태 설정
      // 두 번째 인자 {}는 요청 body (내용 없지만 POST라 필요)
      await axios.post(`${API_URL}/presence/online`, {}, getAuthHeader());

      /**
       * 로컬 상태에서 본인 항목만 status를 'online'으로 교체합니다.
       *
       * localStorage.getItem('userId'): 로컬 스토리지에서 userId를 문자열로 읽음
       * parseInt(...|| '0'): 문자열을 숫자로 변환 (없으면 '0' → 0)
       *
       * { ...p, status: 'online' as const } 해석:
       * - ...p: 기존 Presence 객체의 모든 속성을 펼침 (얕은 복사)
       * - status: 'online' as const: status만 'online'으로 덮어씀
       * - as const: TypeScript에게 이 값이 string이 아닌 정확히 'online'임을 알림
       *   (Presence 타입의 status가 유니온 타입이라 필요)
       */
      setTeamPresence(prev => prev.map(p =>
        p.id === parseInt(localStorage.getItem('userId') || '0')
          ? { ...p, status: 'online' as const }  // 본인 → online으로 변경
          : p                                      // 다른 사람 → 그대로 유지
      ));

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set online');
    }
  };

  /**
   * setOffline: 본인 상태를 'offline'으로 변경합니다.
   *
   * setOnline과 구조가 동일하며 status만 'offline'으로 다릅니다.
   * 브라우저 탭 종료, 네트워크 끊김 시 자동으로 호출됩니다. (아래 useEffect 참고)
   *
   * ⚠️ setOnline과 동일한 localStorage 버그가 있습니다.
   */
  const setOffline = async () => {
    try {
      await axios.post(`${API_URL}/presence/offline`, {}, getAuthHeader());

      setTeamPresence(prev => prev.map(p =>
        p.id === parseInt(localStorage.getItem('userId') || '0')
          ? { ...p, status: 'offline' as const } // 본인 → offline으로 변경
          : p
      ));

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set offline');
    }
  };

  // ──────────────────────────────────────────────
  // 브라우저 네트워크 상태 감지
  // ──────────────────────────────────────────────

  /**
   * useEffect: 브라우저의 네트워크 연결/끊김 이벤트를 감지합니다.
   *
   * 브라우저 이벤트 종류:
   * - 'online'  : 인터넷 연결이 복구될 때 발생
   *   (와이파이 재연결, 케이블 연결 등)
   * - 'offline' : 인터넷 연결이 끊길 때 발생
   *   (와이파이 끊김, 비행기 모드 전환 등)
   *
   * window.addEventListener(이벤트명, 핸들러 함수):
   * - 특정 이벤트가 발생할 때 실행할 함수를 등록합니다.
   * - DOM 이벤트 리스너라고 부릅니다.
   *
   * 실제 동작 시나리오:
   * 1. 사용자 와이파이 끊김 → 'offline' 이벤트 발생 → setOffline() 호출
   *    → 서버에 오프라인 상태 전달 → 팀원들 화면에서 회색 점으로 변경
   * 2. 와이파이 재연결 → 'online' 이벤트 발생 → setOnline() 호출
   *    → 서버에 온라인 상태 전달 → 팀원들 화면에서 초록 점으로 변경
   */
  useEffect(() => {
    /**
     * 이벤트 핸들러를 변수에 저장하는 이유:
     * 클린업(return 함수)에서 removeEventListener로 정확히 같은 함수를 제거해야 합니다.
     * 화살표 함수를 직접 넣으면 등록할 때와 제거할 때 서로 다른 함수 참조가 되어
     * 제거가 되지 않는 버그가 발생합니다.
     *
     * ❌ 잘못된 예:
     *   window.addEventListener('online', () => setOnline());
     *   window.removeEventListener('online', () => setOnline()); // 다른 함수 참조라 제거 안 됨!
     *
     * ✅ 올바른 예 (현재 코드):
     *   const handler = () => setOnline();
     *   window.addEventListener('online', handler);
     *   window.removeEventListener('online', handler); // 같은 참조 → 정상 제거
     */
    const handleOnline = () => setOnline();
    const handleOffline = () => setOffline();

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    /**
     * 클린업 함수: 컴포넌트가 언마운트될 때 실행됩니다.
     *
     * 왜 반드시 제거해야 하나요?
     * - 컴포넌트가 화면에서 사라져도 window 이벤트 리스너는 계속 살아있습니다.
     * - 제거하지 않으면 메모리 누수와 함께, 이미 사라진 컴포넌트의 상태를
     *   업데이트하려다 에러가 발생합니다.
     * - React 개발 환경에서 "Can't perform a React state update on an unmounted
     *   component" 경고가 뜨는 주요 원인입니다.
     */
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };

  }, []);
  // ↑ 빈 배열 []: 컴포넌트가 처음 마운트될 때 딱 한 번만 실행합니다.
  //
  // ⚠️ 잠재적 버그: setOnline, setOffline이 의존성 배열에 없습니다.
  //    이 함수들은 매 렌더링마다 새로 생성되므로, 핸들러가 처음 등록된
  //    시점의 함수를 계속 참조하는 "Stale Closure" 문제가 생길 수 있습니다.
  //
  //    완전한 해결책:
  //    setOnline, setOffline을 useCallback으로 감싸고 의존성 배열에 추가하거나,
  //    useRef로 최신 함수를 참조하는 패턴을 사용합니다.

  // ──────────────────────────────────────────────
  // 반환값
  // ──────────────────────────────────────────────

  /**
   * 훅을 사용하는 컴포넌트에 상태와 함수들을 반환합니다.
   *
   * 사용 예시:
   *   const { teamPresence, fetchTeamPresence, updateStatus } = usePresence({ token });
   *
   *   // 팀 선택 시 해당 팀의 Presence 불러오기
   *   useEffect(() => {
   *     fetchTeamPresence(selectedTeamId);
   *   }, [selectedTeamId]);
   *
   *   // 상태 변경 UI
   *   <select onChange={(e) => updateStatus(e.target.value)}>
   *     <option value="online">🟢 온라인</option>
   *     <option value="away">🟡 자리 비움</option>
   *     <option value="busy">🔴 방해 금지</option>
   *     <option value="offline">⚫ 오프라인</option>
   *   </select>
   *
   *   // 팀원 목록에 상태 표시
   *   {teamPresence.map(member => (
   *     <div key={member.id}>
   *       <span>{member.nickname}</span>
   *       <StatusDot status={member.status} />
   *     </div>
   *   ))}
   */
  return {
    teamPresence,        // 팀 멤버 Presence 배열 (멤버 목록 UI 렌더링에 사용)
    loading,             // 로딩 중 여부
    error,               // 에러 메시지
    fetchTeamPresence,   // 팀 Presence 조회 (팀 입장 시 호출)
    updateStatus,        // 상태 수동 변경 (away, busy 등)
    setOnline,           // 온라인으로 변경
    setOffline,          // 오프라인으로 변경
  };
}