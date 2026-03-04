import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadImage, uploadFile, uploadMultiple, uploadVideo, handleUploadError } from '../middleware/upload';

const router = Router();

// 에러 처리 미들웨어 추가
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Upload error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

import multer from 'multer';

// 단일 이미지 업로드
router.post('/image', 
  authMiddleware,
  uploadImage.single('image'),
  (req: Request, res: Response) => {
    console.log('Upload image request:', req.file);
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    res.json({
      url: `/uploads/images/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  }
);

// 다중 이미지 업로드
router.post('/images',
  authMiddleware,
  uploadImage.array('images', 5),
  (req: Request, res: Response) => {
    console.log('Upload images request:', req.files);
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    
    const files = req.files.map((file: Express.Multer.File) => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));
    
    res.json({ files });
  }
);

// 파일 업로드
router.post('/file',
  authMiddleware,
  uploadFile.single('file'),
  (req: Request, res: Response) => {
    console.log('Upload file request:', req.file);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      url: `/uploads/files/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }
);

// 다중 파일 업로드 (이미지 + 파일)
router.post('/files',
  authMiddleware,
  uploadMultiple.array('files', 10),
  (req: Request, res: Response) => {
    console.log('Upload multiple files request:', req.files);
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map((file: Express.Multer.File) => ({
      url: file.mimetype.startsWith('image/') 
        ? `/uploads/images/${file.filename}`
        : `/uploads/files/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      type: file.mimetype.startsWith('image/') ? 'image' : 'file'
    }));
    
    res.json({ files });
  }
);

// 동영상 업로드
router.post('/video',
  authMiddleware,
  uploadVideo.single('file'),
  (req: Request, res: Response) => {
    console.log('Upload video request:', req.file);
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }
    
    res.json({
      url: `/uploads/videos/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }
);

export default router;
