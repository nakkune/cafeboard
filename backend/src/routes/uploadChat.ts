import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { getIO } from '../utils/websocket';

const router = Router();

// uploads 디렉토리 생성
const uploadsDir = path.join(process.cwd(), 'uploads', 'chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/chat/${req.file.filename}`;
  const channelId = req.body.channelId ? parseInt(req.body.channelId) : null;
  const conversationId = req.body.conversationId ? parseInt(req.body.conversationId) : null;
  const userId = req.userId;

  try {
    const originalName = req.body.originalName
      ? decodeURIComponent(req.body.originalName)
      : req.file.originalname;

    // 1. 메시지와 첨부파일을 Atomic하게 생성 (시니어 개발자의 트랜잭션 처리)
    const message = await prisma.message.create({
      data: {
        content: originalName,
        channelId: channelId || undefined,
        conversationId: conversationId || undefined,
        authorId: userId as number,
        type: 'file',
        attachments: {
          create: {
            uploaderId: userId as number,
            filename: req.file.filename,
            originalName: originalName,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url: fileUrl
          }
        }
      },
      include: {
        author: {
          select: { id: true, nickname: true, name: true, profileImage: true }
        },
        attachments: true // 실시간 전송을 위해 반드시 포함
      }
    });

    // 2. 소켓 전송 (대상 전파 대상 식별)
    const io = getIO();
    if (io) {
      if (channelId) {
        io.to(`channel:${channelId}`).emit('message_new', message);
      } else if (conversationId) {
        io.to(`conversation:${conversationId}`).emit('conversation_message', message);
      }
    }

    res.json(message);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
