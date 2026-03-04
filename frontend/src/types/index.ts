export interface User {
  id: number;
  email: string;
  nickname: string;
  name?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  profileImage?: string;
  bio?: string;
  role: 'member' | 'moderator' | 'admin';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  readPermission: string;
  writePermission: string;
}

export interface PostImage {
  id: number;
  postId: number;
  imageUrl: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

export interface PostFile {
  id: number;
  postId: number;
  fileUrl: string;
  fileName: string;
  originalName: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId?: number;
  author?: User;
  categoryId: number;
  category?: Category;
  isNotice: boolean;
  isSecret: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: 'published' | 'draft' | 'hidden';
  images?: PostImage[];
  files?: PostFile[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  authorId?: number;
  author?: User;
  parentId?: number;
  content: string;
  likeCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nickname: string;
  name?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface Event {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  color?: string;
  authorId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Video {
  id: number;
  title: string;
  description?: string;
  videoType: 'local' | 'external';
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  categoryId?: number;
  category?: Category;
  authorId: number;
  author?: User;
  viewCount: number;
  status: 'published' | 'hidden' | 'draft';
  createdAt: string;
  updatedAt: string;
}
