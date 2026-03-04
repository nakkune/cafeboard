import { Router } from 'express';
import { adminController } from '../controllers/admin';
import { adminMiddleware, strictAdminMiddleware } from '../middleware/admin';

const router = Router();

// 모든 관리자 라우트에 관리자 미들웨어 적용
router.use(adminMiddleware);

// 회원 목록 조회
router.get('/users', adminController.getUsers);

// 사용자 권한 변경 (admin만 가능)
router.put('/users/:id/role', strictAdminMiddleware, adminController.updateUserRole);

// 사용자 활성화/비활성화 (admin만 가능)
router.put('/users/:id/status', strictAdminMiddleware, adminController.toggleUserStatus);

// 회원 승인/거절
router.post('/members/:id/approve', adminController.approveMember);

// 회원 등급 변경
router.put('/members/:id/level', adminController.updateMemberLevel);

// 신고 목록 조회
router.get('/reports', adminController.getReports);

// 신고 처리
router.put('/reports/:id', adminController.resolveReport);

// 통계 데이터 조회
router.get('/stats', adminController.getStats);

// 콘텐츠 관리 (게시물)
router.get('/content/posts', adminController.getAdminPosts);
router.put('/content/posts/:id/status', adminController.updatePostStatus);

// 콘텐츠 관리 (댓글)
router.get('/content/comments', adminController.getAdminComments);
router.delete('/content/comments/:id', adminController.deleteComment);

// 시스템 설정
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

export default router;
