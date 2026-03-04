import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 업로드 디렉토리 확인 및 생성
const uploadDir = './uploads';
const imagesDir = './uploads/images';
const filesDir = './uploads/files';
const videosDir = './uploads/videos';

[uploadDir, imagesDir, filesDir, videosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 파일명 생성 함수
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname);
  return `${timestamp}-${random}${ext}`;
};

// 파일명 디코딩 함수
const decodeFilename = (filename: string): string => {
  try {
    // 버퍼로 변환하여 UTF-8로 디코딩
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch {
    return filename;
  }
};

// 이미지 업로드 설정
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    file.originalname = decodeFilename(file.originalname);
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// 일반 파일 업로드 설정
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    file.originalname = decodeFilename(file.originalname);
    console.log('Multer file destination:', file);
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    console.log('Multer filename:', file.originalname);
    cb(null, generateFilename(file.originalname));
  }
});

// 이미지 필터
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg/;
  const allowedMimes = /image\/jpeg|image\/png|image\/gif|image\/webp|image\/svg\+xml/;
  
  const extname = file.originalname ? allowedExtensions.test(path.extname(file.originalname).toLowerCase()) : true;
  const mimetype = allowedMimes.test(file.mimetype);

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// 파일 필터
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Multer file filter:', file);
  cb(null, true);
};

// 업로드 미들웨어
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadFile = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 다중 파일 업로드
export const uploadMultiple = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      file.originalname = decodeFilename(file.originalname);
      const isImage = file.mimetype.startsWith('image/');
      cb(null, isImage ? imagesDir : filesDir);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 동영상 업로드 설정
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    file.originalname = decodeFilename(file.originalname);
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  }
});

// 동영상 필터
const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /mp4|webm|ogg|quicktime/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.replace('video/', ''));

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// 에러 핸들러
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
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
