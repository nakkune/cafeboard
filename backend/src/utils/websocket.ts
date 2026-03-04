/**
 * ============================================================
 * 📡 WebSocket 서버 설정 파일
 * ============================================================
 *
 * WebSocket이란?
 * - 일반 HTTP는 클라이언트가 요청해야만 서버가 응답합니다 (단방향).
 * - WebSocket은 한 번 연결되면 서버↔클라이언트가 언제든 데이터를
 *   주고받을 수 있는 "실시간 양방향 통신" 방식입니다.
 * - 채팅, 알림, 실시간 협업 등에 필수적으로 사용됩니다.
 *
 * Socket.IO란?
 * - 순수 WebSocket 위에 편의 기능을 추가한 라이브러리입니다.
 * - "룸(room)" 개념으로 특정 그룹에만 메시지를 보낼 수 있고,
 *   자동 재연결, 이벤트 기반 통신 등을 지원합니다.
 * ============================================================
 */

// Node.js 기본 HTTP 서버 타입을 가져옵니다.
// Express 앱을 http.createServer()로 감싼 서버가 바로 이 타입입니다.
import { Server as HttpServer } from 'http';

// Socket.IO의 서버 클래스와 소켓(개별 연결) 타입을 가져옵니다.
// Server  → 전체 WebSocket 서버 (여러 클라이언트를 관리)
// Socket  → 개별 클라이언트 하나의 연결을 나타냄
import { Server as SocketIOServer, Socket } from 'socket.io';

// JWT(JSON Web Token): 로그인한 사용자를 식별하는 암호화된 토큰입니다.
// 클라이언트가 연결 시 이 토큰을 보내면, 서버가 검증해 누구인지 확인합니다.
import jwt from 'jsonwebtoken';

// Prisma: 데이터베이스를 편리하게 다룰 수 있게 해주는 ORM(Object-Relational Mapping)입니다.
// SQL을 직접 쓰지 않고 자바스크립트 코드로 DB 조회/저장이 가능합니다.
import { prisma } from '../utils/db';

// JWT 서명에 사용되는 비밀키입니다.
// 환경변수(process.env)에서 읽어오고, 없으면 기본값을 사용합니다.
// ⚠️ 실제 운영 환경에서는 반드시 환경변수로 관리해야 합니다!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * AuthSocket: 기본 Socket 타입을 확장한 커스텀 타입입니다.
 *
 * TypeScript의 interface는 "이 객체는 이런 속성을 가진다"고 정의하는 설계도입니다.
 * 기본 Socket에는 userId, userNickname이 없기 때문에,
 * 인증 후 사용자 정보를 소켓에 붙여두기 위해 직접 확장했습니다.
 *
 * ?가 붙은 속성(userId?)은 "있을 수도, 없을 수도 있음(optional)"을 의미합니다.
 */
interface AuthSocket extends Socket {
  userId?: number;       // 로그인한 사용자의 DB ID
  userNickname?: string; // 사용자 닉네임 (타이핑 표시 등에 활용)
}

/**
 * io: Socket.IO 서버 인스턴스를 모듈 전체에서 사용하기 위한 변수입니다.
 *
 * 이 파일 외부(예: HTTP API 라우터)에서도 WebSocket으로 이벤트를 보내야 할 때
 * getIO()를 통해 이 인스턴스를 가져다 씁니다.
 */
let io: SocketIOServer;

/**
 * getIO(): 어디서든 io 인스턴스에 접근할 수 있게 해주는 함수입니다.
 *
 * 예시 사용처:
 *   // 메시지 REST API에서 WebSocket으로 알림 보낼 때
 *   getIO().to(`user:${userId}`).emit('notification', data);
 */
export function getIO() {
  return io;
}

/**
 * setupWebSocket(): WebSocket 서버를 초기화하고 모든 이벤트를 등록하는 메인 함수입니다.
 *
 * @param httpServer - Express와 연결된 Node.js HTTP 서버
 * @returns 초기화된 Socket.IO 서버 인스턴스
 *
 * 호출 순서:
 * 1. Socket.IO 서버 생성 (HTTP 서버에 연결)
 * 2. 인증 미들웨어 등록 (모든 연결에 JWT 검증 적용)
 * 3. 연결 이벤트 핸들러 등록 (실제 이벤트 처리 로직)
 */
export function setupWebSocket(httpServer: HttpServer) {

  // ─────────────────────────────────────────────
  // 1단계: Socket.IO 서버 생성
  // ─────────────────────────────────────────────

  /**
   * HTTP 서버 위에 Socket.IO 서버를 올립니다.
   * 같은 포트(예: 3000)에서 HTTP 요청과 WebSocket 연결을 함께 처리합니다.
   *
   * cors(Cross-Origin Resource Sharing) 설정:
   * - 브라우저는 보안상 다른 도메인으로의 요청을 기본 차단합니다.
   * - origin: '*'는 모든 도메인 허용이라 개발 중엔 편리하지만,
   *   ⚠️ 운영 환경에서는 실제 도메인을 명시해야 보안상 안전합니다.
   *   예: origin: 'https://mychat.com'
   */
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',               // 모든 출처 허용 (개발용)
      methods: ['GET', 'POST']   // 허용할 HTTP 메서드
    }
  });

  // ─────────────────────────────────────────────
  // 2단계: 인증 미들웨어 (모든 연결에 자동 적용)
  // ─────────────────────────────────────────────

  /**
   * io.use()는 Express의 app.use()와 비슷한 "미들웨어"입니다.
   * 클라이언트가 연결을 시도할 때마다 이 함수가 먼저 실행됩니다.
   *
   * next(에러없이 호출) → 연결 허용
   * next(new Error()) → 연결 거부
   *
   * 클라이언트는 연결 시 이렇게 토큰을 보냅니다:
   *   const socket = io('http://server', {
   *     auth: { token: 'eyJhbGci...' }
   *   });
   */
  io.use((socket: AuthSocket, next) => {
    // 클라이언트가 연결 시 auth 객체에 담아 보낸 JWT 토큰을 꺼냅니다.
    const token = socket.handshake.auth.token;

    // 토큰이 아예 없으면 인증 실패 처리
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      /**
       * jwt.verify(): 토큰의 유효성을 검사하고 내용(payload)을 꺼냅니다.
       * - 토큰이 위조되었거나 만료된 경우 에러를 던집니다.
       * - 성공 시 decoded에는 토큰 생성 시 넣었던 데이터(userId 등)가 담깁니다.
       *
       * as { userId: number }는 TypeScript에게 타입을 알려주는 "타입 단언"입니다.
       */
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

      // 검증 성공 → 소켓 객체에 userId를 저장 (이후 핸들러에서 사용)
      socket.userId = decoded.userId;

      // next()를 인자 없이 호출하면 "통과"를 의미합니다.
      next();
    } catch (err) {
      // 토큰이 변조되었거나 만료된 경우
      next(new Error('Invalid token'));
    }
  });

  // ─────────────────────────────────────────────
  // 3단계: 연결 이벤트 핸들러
  // ─────────────────────────────────────────────

  /**
   * 'connection' 이벤트: 새 클라이언트가 성공적으로 연결될 때 발생합니다.
   * 인증 미들웨어를 통과한 클라이언트만 여기까지 도달합니다.
   *
   * socket: 이 특정 클라이언트와의 연결을 나타내는 객체입니다.
   * - socket.emit()   → 이 클라이언트에게만 전송
   * - socket.to(룸)   → 이 클라이언트를 제외한 룸 멤버에게 전송
   * - io.to(룸)       → 이 클라이언트를 포함한 룸 전체에 전송
   */
  io.on('connection', async (socket: AuthSocket) => {
    console.log(`User ${socket.userId} connected`);

    /**
     * 연결 즉시 사용자 정보를 DB에서 조회합니다.
     * select 옵션으로 필요한 컬럼(nickname)만 가져와 불필요한 데이터 전송을 줄입니다.
     *
     * ⚠️ 개선 포인트: socket.userId가 undefined일 경우 잘못된 쿼리가 실행됩니다.
     * 실제로는 if (!socket.userId) { socket.disconnect(); return; } 체크가 필요합니다.
     */
    const user = await prisma.user.findUnique({
      where: { id: socket.userId },
      select: { nickname: true }  // nickname 필드만 가져옴 (성능 최적화)
    });

    // 닉네임을 소켓에 저장. DB에 없으면 'Unknown'으로 대체
    socket.userNickname = user?.nickname || 'Unknown';

    /**
     * 개인 룸에 자동 입장합니다.
     * 룸(room): 특정 그룹에게만 이벤트를 보낼 수 있는 Socket.IO의 논리적 그룹 개념
     *
     * 'user:123' 형태로 개인 룸을 만들면,
     * 서버 어디서든 io.to('user:123').emit(...)으로 특정 사용자에게만 알림을 보낼 수 있습니다.
     * (예: "새 DM이 왔어요", "회원님을 멘션했어요")
     */
    socket.join(`user:${socket.userId}`);

    // ─────────────────────────────────────────────
    // 채널 관련 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'join_channel': 클라이언트가 특정 채널에 입장할 때 발생하는 이벤트입니다.
     *
     * 입장 전 반드시 권한을 검증합니다:
     * - private 채널: 채널 멤버 테이블에 해당 유저가 있는지 확인
     * - public 채널: 워크스페이스 멤버인지만 확인
     *
     * data 객체: 클라이언트가 이벤트와 함께 보내는 데이터
     * 예: socket.emit('join_channel', { channelId: 42 })
     */
    socket.on('join_channel', async (data: { channelId: number }) => {
      const { channelId } = data;  // 구조 분해 할당으로 channelId만 꺼냄

      // 채널이 실제로 존재하는지 확인
      const channel = await prisma.channel.findFirst({
        where: { id: channelId }
      });

      // 채널이 없으면 아무것도 하지 않고 종료 (조용한 실패)
      // ⚠️ 개선 포인트: socket.emit('error', ...) 으로 클라이언트에 알려주는 것이 좋습니다.
      if (!channel) return;

      if (channel.type === 'private') {
        // 🔒 비공개 채널: 해당 채널의 멤버인지 확인
        const member = await prisma.channelMember.findFirst({
          where: { channelId, userId: socket.userId }
        });
        if (!member) return; // 멤버가 아니면 입장 거부
      } else {
        // 🌐 공개 채널: 해당 워크스페이스 멤버인지만 확인
        const workspaceMember = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId: channel.workspaceId,
            userId: socket.userId
          }
        });
        if (!workspaceMember) return; // 워크스페이스 멤버가 아니면 입장 거부
      }

      // 권한 검증 통과 → 채널 룸에 입장
      // 이제 io.to(`channel:${channelId}`)로 보내는 이벤트를 수신할 수 있습니다.
      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.userId} joined channel ${channelId}`);
    });

    /**
     * 'leave_channel': 클라이언트가 채널에서 나갈 때 발생하는 이벤트입니다.
     * socket.leave()로 룸에서 제거되면 해당 채널의 이벤트를 더 이상 받지 않습니다.
     */
    socket.on('leave_channel', (data: { channelId: number }) => {
      const { channelId } = data;
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.userId} left channel ${channelId}`);
    });

    // ─────────────────────────────────────────────
    // 팀(워크스페이스) 관련 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'join_team': 팀(워크스페이스) 룸에 입장하는 이벤트입니다.
     * 팀 룸은 "누가 온라인인지" 같은 팀 전체 상태를 공유할 때 사용합니다.
     *
     * 입장 성공 시 팀 전체에 'user_online' 이벤트를 broadcast합니다.
     * broadcast: 특정 그룹의 모든 멤버에게 동시에 메시지를 보내는 것
     */
    socket.on('join_team', async (data: { teamId: number }) => {
      const { teamId } = data;

      // 해당 팀의 워크스페이스 멤버인지 확인
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: teamId, userId: socket.userId }
      });

      if (!member) return; // 멤버가 아니면 거부

      socket.join(`team:${teamId}`);

      // 팀 전체(본인 포함)에게 "이 유저가 접속했다"고 알림
      // io.to() vs socket.to(): io는 본인 포함, socket.to는 본인 제외
      io.to(`team:${teamId}`).emit('user_online', { userId: socket.userId });
    });

    /**
     * 'leave_team': 팀 룸에서 나갈 때 발생하는 이벤트입니다.
     * 팀 전체에 'user_offline' 이벤트를 전송하여 오프라인 상태를 알립니다.
     */
    socket.on('leave_team', (data: { teamId: number }) => {
      const { teamId } = data;
      socket.leave(`team:${teamId}`);
      io.to(`team:${teamId}`).emit('user_offline', { userId: socket.userId });
    });

    // ─────────────────────────────────────────────
    // 메시지 관련 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'send_message': 채널에 새 메시지를 전송하는 핵심 이벤트입니다.
     *
     * 처리 흐름:
     * 1. 채널 존재 여부 확인
     * 2. 해당 채널 접근 권한 확인
     * 3. DB에 메시지 저장
     * 4. 채널 전체에 새 메시지 broadcast
     * 5. 스레드 답글인 경우 부모 메시지의 답글 수도 업데이트
     *
     * ⚠️ 개선 포인트: join_channel에서 이미 권한 체크를 했다면
     *    socket.rooms.has(`channel:${channelId}`) 로 대체해 DB 쿼리를 줄일 수 있습니다.
     */
    socket.on('send_message', async (data: {
      channelId: number;
      content: string;
      type?: string;    // 메시지 타입 (기본값: 'text', 'image', 'file' 등)
      parentId?: number // 스레드 답글인 경우 부모 메시지 ID
    }) => {
      // 기본값 할당: type이 없으면 'text'로 설정
      const { channelId, content, type = 'text', parentId } = data;

      // 채널 유효성 확인
      const channel = await prisma.channel.findFirst({
        where: { id: channelId }
      });
      if (!channel) return;

      // 채널 접근 권한 체크 (join_channel과 동일한 로직 반복)
      // ⚠️ 이 로직이 중복됩니다. 별도 함수(hasChannelAccess)로 분리하면 유지보수가 쉬워집니다.
      let hasAccess = false;
      if (channel.type === 'private') {
        const member = await prisma.channelMember.findFirst({
          where: { channelId, userId: socket.userId }
        });
        hasAccess = !!member; // !!로 null/undefined를 false로, 객체를 true로 변환
      } else {
        const workspaceMember = await prisma.workspaceMember.findFirst({
          where: { workspaceId: channel.workspaceId, userId: socket.userId }
        });
        hasAccess = !!workspaceMember;
      }
      if (!hasAccess) return;

      /**
       * 메시지를 DB에 저장합니다.
       * include: 저장 후 연관된 데이터(author, attachments)를 함께 조회
       * 이렇게 하면 응답으로 바로 완성된 메시지 객체를 보낼 수 있습니다.
       */
      const message = await prisma.message.create({
        data: {
          channelId,
          authorId: socket.userId!,  // !는 "undefined가 절대 아님"을 TypeScript에게 단언
          content,
          type: type as any,         // Prisma enum 타입 호환을 위한 임시 캐스팅
          parentId: parentId || null  // 스레드 아니면 null
        },
        include: {
          // 작성자 정보 (민감한 정보는 제외하고 필요한 것만)
          author: {
            select: { id: true, nickname: true, name: true, profileImage: true }
          },
          attachments: true  // 첨부파일 전체 포함
        }
      });

      /**
       * 채널에 있는 모든 사용자에게 새 메시지를 전송합니다.
       * io.to(룸): 해당 룸의 모든 소켓(본인 포함)에게 이벤트 전송
       */
      io.to(`channel:${channelId}`).emit('message_new', message);

      /**
       * 스레드 답글인 경우 (parentId가 있을 때):
       * 부모 메시지의 답글 개수를 업데이트해서 채널 전체에 알립니다.
       * (예: "답글 3개" 표시가 실시간으로 갱신되도록)
       */
      if (parentId) {
        const parentMessage = await prisma.message.findFirst({
          where: { id: parentId }
        });
        if (parentMessage) {
          io.to(`channel:${channelId}`).emit('thread_update', {
            parentId,
            replyCount: await prisma.message.count({ where: { parentId } })
          });
        }
      }
    });

    /**
     * 'typing_start': 사용자가 메시지를 입력하기 시작할 때 발생하는 이벤트입니다.
     *
     * socket.to(룸): io.to(룸)와 달리 이벤트를 보낸 본인을 제외하고 전송합니다.
     * (자기 자신에게는 "OOO님이 입력 중" 표시가 필요 없으므로)
     *
     * 클라이언트에서는 키 입력 시 이 이벤트를 보내고,
     * 일정 시간 입력이 없으면 'typing_stop'을 보냅니다.
     */
    socket.on('typing_start', (data: { channelId: number }) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('user_typing', {
        channelId,
        userId: socket.userId,
        nickname: socket.userNickname,
        isTyping: true   // 입력 중
      });
    });

    /**
     * 'typing_stop': 사용자가 입력을 멈췄을 때 발생하는 이벤트입니다.
     * 채널의 다른 사용자들의 "OOO님이 입력 중..." 표시를 사라지게 합니다.
     */
    socket.on('typing_stop', (data: { channelId: number }) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('user_typing', {
        channelId,
        userId: socket.userId,
        nickname: socket.userNickname,
        isTyping: false  // 입력 중지
      });
    });

    /**
     * 'read_message': 사용자가 메시지를 읽었을 때 발생하는 이벤트입니다.
     * (읽음 표시 기능 구현)
     *
     * 처리 내용:
     * 1. MessageRead 테이블에 읽음 기록 저장 (이미 있으면 시간만 업데이트)
     * 2. ChannelMember의 lastReadAt 업데이트 (안 읽은 메시지 수 계산에 활용)
     * 3. 채널 전체에 읽음 이벤트 broadcast (다른 사람 화면에서도 읽음 표시 반영)
     */
    socket.on('read_message', async (data: { channelId: number; messageId: number }) => {
      const { channelId, messageId } = data;

      /**
       * upsert = update + insert
       * 레코드가 있으면 update, 없으면 create를 자동으로 처리합니다.
       * where의 messageId_userId는 Prisma가 복합 unique 키를 표현하는 방식입니다.
       */
      await prisma.messageRead.upsert({
        where: {
          messageId_userId: { messageId, userId: socket.userId! }
        },
        update: { readAt: new Date() },     // 이미 읽은 경우: 시간 갱신
        create: { messageId, userId: socket.userId! }  // 처음 읽는 경우: 새로 생성
      });

      // 채널의 마지막 읽은 시각 업데이트 (안 읽은 메시지 뱃지 계산용)
      await prisma.channelMember.updateMany({
        where: { channelId, userId: socket.userId },
        data: { lastReadAt: new Date() }
      });

      // 채널 전체에 읽음 상태 전파 (실시간 읽음 표시 업데이트)
      io.to(`channel:${channelId}`).emit('message_read', {
        channelId,
        messageId,
        userId: socket.userId
      });
    });

    // ─────────────────────────────────────────────
    // 이모지 반응(Reaction) 관련 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'add_reaction': 메시지에 이모지 반응을 추가하는 이벤트입니다.
     * (슬랙의 👍 ❤️ 같은 이모지 반응)
     *
     * 중복 반응 방지: 같은 사람이 같은 이모지를 중복으로 추가할 수 없습니다.
     */
    socket.on('add_reaction', async (data: { messageId: number; emoji: string }) => {
      const { messageId, emoji } = data;

      // 대상 메시지가 존재하고 삭제되지 않았는지 확인
      const message = await prisma.message.findFirst({
        where: { id: messageId, isDeleted: false }
      });
      if (!message) return;

      // 이미 같은 이모지로 반응했는지 확인 (중복 방지)
      const existingReaction = await prisma.reaction.findFirst({
        where: { messageId, userId: socket.userId, emoji }
      });
      if (existingReaction) return; // 이미 반응했으면 무시

      // 반응 DB 저장 (user 정보도 함께 조회)
      const reaction = await prisma.reaction.create({
        data: {
          messageId,
          userId: socket.userId!,
          emoji
        },
        include: {
          user: {
            select: { id: true, nickname: true, name: true }
          }
        }
      });

      // 해당 메시지가 있는 채널 전체에 반응 추가 이벤트 전송
      io.to(`channel:${message.channelId}`).emit('reaction_added', {
        messageId,
        reaction
      });
    });

    /**
     * 'remove_reaction': 이미 추가한 이모지 반응을 취소하는 이벤트입니다.
     *
     * ⚠️ 버그 주의: message 조회 후 null 체크가 없어서
     *    message가 null이면 'channel:undefined' 룸으로 이벤트가 전송됩니다.
     *    if (!message) return; 가 필요합니다.
     */
    socket.on('remove_reaction', async (data: { messageId: number; emoji: string }) => {
      const { messageId, emoji } = data;

      // 삭제할 반응이 실제로 존재하는지 확인
      const reaction = await prisma.reaction.findFirst({
        where: { messageId, userId: socket.userId, emoji }
      });
      if (!reaction) return; // 없으면 무시

      // DB에서 반응 삭제
      await prisma.reaction.delete({ where: { id: reaction.id } });

      // 반응이 달린 메시지의 채널 ID를 알아야 올바른 룸에 이벤트를 보낼 수 있음
      // ⚠️ message가 null일 경우 아래 emit에서 'channel:undefined'로 전송되는 버그 존재
      const message = await prisma.message.findFirst({
        where: { id: messageId }
      });

      io.to(`channel:${message?.channelId}`).emit('reaction_removed', {
        messageId,
        emoji,
        userId: socket.userId
      });
    });

    // ─────────────────────────────────────────────
    // 메시지 수정/삭제 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'update_message': 자신이 작성한 메시지를 수정하는 이벤트입니다.
     *
     * 보안 체크: authorId === socket.userId 조건으로 본인 메시지만 수정 가능
     * isEdited: true 플래그로 "수정된 메시지" 표시를 위한 마킹
     */
    socket.on('update_message', async (data: { messageId: number; content: string }) => {
      const { messageId, content } = data;

      // 본인이 작성한 메시지이고 삭제되지 않은 경우만 수정 가능
      const existingMessage = await prisma.message.findFirst({
        where: {
          id: messageId,
          authorId: socket.userId,  // 🔒 본인 메시지인지 확인
          isDeleted: false
        }
      });
      if (!existingMessage) return;

      // 메시지 수정 후 완성된 객체 반환 (include로 관련 데이터 포함)
      const message = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true  // 수정 여부 플래그 (화면에 "(수정됨)" 표시용)
        },
        include: {
          author: {
            select: { id: true, nickname: true, name: true, profileImage: true }
          },
          attachments: true,
          reactions: true
        }
      });

      // 수정된 메시지를 채널 전체에 전파 (모든 사용자 화면 실시간 업데이트)
      io.to(`channel:${message.channelId}`).emit('message_update', message);
    });

    /**
     * 'delete_message': 메시지를 삭제하는 이벤트입니다.
     *
     * 삭제 권한:
     * - 메시지 작성자 본인
     * - 워크스페이스 관리자(admin) 또는 오너(owner)
     *
     * Hard delete(실제 삭제) 대신 Soft delete 방식 사용:
     * isDeleted: true + content: '[deleted]' 로 변경
     * → 실제 데이터는 유지되어 감사 로그, 복구 등이 가능합니다.
     */
    socket.on('delete_message', async (data: { messageId: number }) => {
      const { messageId } = data;

      // 삭제되지 않은 메시지인지 확인
      const message = await prisma.message.findFirst({
        where: { id: messageId, isDeleted: false }
      });
      if (!message || !message.channelId) return;

      // 메시지가 속한 채널 정보 조회 (워크스페이스 ID 필요)
      const channel = await prisma.channel.findFirst({
        where: { id: message.channelId }
      });

      // 워크스페이스 관리자/오너인지 확인 (관리자 삭제 권한용)
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: channel?.workspaceId,
          userId: socket.userId,
          role: { in: ['owner', 'admin'] }  // owner 또는 admin 역할만
        }
      });

      // 권한 체크: 본인 작성 메시지 OR 관리자 권한 없으면 거부
      if (message.authorId !== socket.userId && !workspaceMember) return;

      /**
       * Soft Delete: 실제로 DB 레코드를 지우지 않고 삭제 표시만 합니다.
       * - isDeleted: true → 조회 시 필터링됨
       * - content: '[deleted]' → 화면에 "[삭제된 메시지]" 표시
       */
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, content: '[deleted]' }
      });

      // 채널 전체에 메시지 삭제 이벤트 전송
      io.to(`channel:${message.channelId}`).emit('message_delete', { messageId });
    });

    // ─────────────────────────────────────────────
    // DM(Direct Message / 1:1 대화) 관련 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'join_conversation': DM 대화방에 입장하는 이벤트입니다.
     * 채널(channel)은 다수가 참여하는 공개/비공개 채널이고,
     * 대화(conversation)는 1:1 또는 소그룹 DM입니다.
     *
     * 입장 전 해당 대화의 참여자인지 검증합니다.
     */
    socket.on('join_conversation', async (data: { conversationId: number }) => {
      const { conversationId } = data;

      // 이 대화의 참여자인지 확인
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: socket.userId }
      });
      if (!participant) return; // 참여자가 아니면 입장 거부

      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    /**
     * 'leave_conversation': DM 대화방에서 나가는 이벤트입니다.
     */
    socket.on('leave_conversation', (data: { conversationId: number }) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    /**
     * 'send_conversation_message': DM 메시지를 전송하는 이벤트입니다.
     *
     * 채널 메시지와의 차이점:
     * - channelId 대신 conversationId를 사용
     * - conversation의 updatedAt도 함께 갱신 (최근 대화 목록 정렬용)
     * - 권한 체크가 상대적으로 단순 (참여자 여부만 확인)
     */
    socket.on('send_conversation_message', async (data: {
      conversationId: number;
      content: string
    }) => {
      const { conversationId, content } = data;

      // 대화 참여자인지 다시 확인 (보안상 재검증)
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: socket.userId }
      });
      if (!participant) return;

      // DM 메시지 저장 (channelId 없이 conversationId로 연결)
      const message = await prisma.message.create({
        data: {
          content,
          conversationId,
          authorId: socket.userId!
        },
        include: {
          author: {
            select: { id: true, nickname: true, name: true, profileImage: true }
          }
        }
      });

      // 대화의 마지막 활동 시각 업데이트 (DM 목록에서 최신순 정렬에 활용)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // 대화 참여자 전체에게 새 메시지 전송
      io.to(`conversation:${conversationId}`).emit('conversation_message_new', message);
    });

    // ─────────────────────────────────────────────
    // 연결 해제 이벤트
    // ─────────────────────────────────────────────

    /**
     * 'disconnect': 클라이언트 연결이 끊어질 때 자동으로 발생하는 이벤트입니다.
     * (브라우저 탭 닫기, 네트워크 끊김, 명시적 disconnect() 호출 등)
     *
     * 사용자 상태를 'offline'으로 변경하고 마지막 활동 시각을 기록합니다.
     *
     * ⚠️ 개선 포인트: socket.userId가 undefined일 경우 prisma 쿼리 오류 발생
     *    if (!socket.userId) return; 체크가 필요합니다.
     */
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);

      /**
       * userPresence 테이블에 오프라인 상태 기록
       * upsert: 이미 presence 레코드가 있으면 update, 없으면 create
       */
      await prisma.userPresence.upsert({
        where: { userId: socket.userId },
        update: {
          status: 'offline',
          lastActiveAt: new Date()   // 마지막 접속 시각 기록
        },
        create: {
          userId: socket.userId!,
          status: 'offline'
        }
      });
    });
  });

  // 초기화 완료된 io 인스턴스를 반환 (외부에서 필요시 사용)
  return io;
}