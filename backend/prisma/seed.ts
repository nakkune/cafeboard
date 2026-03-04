import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 미리 해시된 비밀번호 (password123)
//const hashedPassword = '$2a$10$rBV2JzS7v8R3QxFxVxVxXeJxVxVxVxVxVxVxVxVxVxVxVxVxXe'; // 더미 해시
//const adminPassword = '$2a$10$rBV2JzS7v8R3QxFxVxVxXeJxVxVxVxVxVxVxVxVxVxVxVxVxXe'; // 더미 해시

// 실제 bcrypt 해시 생성 함수
const hashPassword = async (password: string): Promise<string> => {
  const salt = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));
  return salt;
};

async function main() {
  console.log('Start seeding...');

  // 한국어 카테고리 생성
  const categories = [
    { name: '공지사항', description: '커뮤니티 공지 및 안내사항', sortOrder: 1, writePermission: 'admin' },
    { name: '자유게시판', description: '자유롭게 이야기 나누는 공간', sortOrder: 2 },
    { name: '질문게시판', description: '궁금한 점을 질문하고 답변하는 공간', sortOrder: 3 },
    { name: '정보공유', description: '유용한 정보와 지식을 공유하는 공간', sortOrder: 4 },
    { name: '홍보게시판', description: '프로젝트, 서비스, 이벤트 홍보 공간', sortOrder: 5 },
    { name: '건의사항', description: '커뮤니티 개선을 위한 제안', sortOrder: 6 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        writePermission: category.writePermission || 'member',
      },
    });
  }
  console.log('✅ 카테고리 생성 완료');

  // 관리자 계정 생성
  const adminPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@cafeboard.com' },
    update: { memberStatus: 'approved', memberLevel: 'regular' },
    create: {
      email: 'admin@cafeboard.com',
      passwordHash: adminPassword,
      nickname: '관리자',
      role: 'admin',
      memberStatus: 'approved',
      memberLevel: 'regular',
    },
  });
  console.log('✅ 관리자 계정 생성 완료 (admin@cafeboard.com / admin123)');

  // 샘플 게시글 생성
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@cafeboard.com' },
  });

  if (admin) {
    const noticeCategory = await prisma.category.findFirst({
      where: { name: '공지사항' },
    });

    if (noticeCategory) {
      await prisma.post.upsert({
        where: { id: 1 },
        update: {},
        create: {
          title: 'CafeBoard에 오신 것을 환영합니다!',
          content: '안녕하세요! CafeBoard 커뮤니티에 오신 것을 환영합니다.\n\n이곳은 다양한 주제로 자유롭게 대화를 나누고, 지식을 공유하는 공간입니다.\n\n즐거운 시간 복내세요!',
          authorId: admin.id,
          categoryId: noticeCategory.id,
          isNotice: true,
        },
      });

      await prisma.post.upsert({
        where: { id: 2 },
        update: {},
        create: {
          title: '커뮤니티 이용 규칙',
          content: '1. 서로를 존중하는 언어를 사용해주세요.\n2. 스팸, 도배, 홍보성 글은 삼가해주세요.\n3. 타인의 개인정보를 보호해주세요.\n4. 건전하고 즐거운 커뮤니티를 함께 만들어요!',
          authorId: admin.id,
          categoryId: noticeCategory.id,
          isNotice: true,
        },
      });

      console.log('✅ 샘플 게시글 생성 완료');
    }

    // 채팅 관련 초기 데이터
    // 테스트 사용자 생성
    /*
    const testPassword = await hashPassword('password123');

    const user1 = await prisma.user.upsert({
      where: { email: 'user1@test.com' },
      update: { memberStatus: 'approved' },
      create: {
        email: 'user1@test.com',
        passwordHash: testPassword,
        nickname: '사용자1',
        name: 'User One',
        memberStatus: 'approved',
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'user2@test.com' },
      update: { memberStatus: 'approved' },
      create: {
        email: 'user2@test.com',
        passwordHash: testPassword,
        nickname: '사용자2',
        name: 'User Two',
        memberStatus: 'approved',
      },
    });

    // 테스트 팀 생성
    const team = await prisma.workspace.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Test Team',
        description: '테스트 팀입니다',
        isPublic: true,
        ownerId: user1.id,
        members: {
          create: [
            { userId: user1.id, role: 'owner' },
            { userId: user2.id, role: 'member' }
          ]
        }
      },
    });

    // 테스트 채널 생성
    await prisma.channel.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'general',
        description: '일반 채널',
        type: 'public',
        workspaceId: team.id,
        members: {
          create: [
            { userId: user1.id },
            { userId: user2.id }
          ]
        }
      },
    });

    await prisma.channel.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'random',
        description: '잡담 채널',
        type: 'public',
        workspaceId: team.id,
        members: {
          create: [
            { userId: user1.id },
            { userId: user2.id }
          ]
        }
      },
    });
    */

    console.log('✅ 채팅 테스트 데이터 생성 완료');

    console.log('Seeding finished!');
  }

  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
