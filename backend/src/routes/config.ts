import { Router } from 'express';
import { prisma } from '../utils/db';

const router = Router();

// 공개 시스템 설정 조회 (누구나 접근 가능)
router.get('/settings', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['site_name', 'maintenance_mode'] // 민감하지 않은 정보만 공개
                }
            }
        });

        const settingsMap = settings.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(settingsMap);
    } catch (error) {
        console.error('Public settings fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

export default router;
