import { api } from './index';
import type { Video } from '../types';

export interface VideoParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
  videoType?: 'local' | 'external';
}

export const videoApi = {
  getVideos: (params?: VideoParams) => 
    api.get<{ videos: Video[]; pagination: any }>('/videos', { params }),
  
  getVideo: (id: number) => 
    api.get<{ video: Video }>(`/videos/${id}`),
  
  createVideo: (data: Partial<Video>) => 
    api.post<{ video: Video }>('/videos', data),
  
  updateVideo: (id: number, data: Partial<Video>) => 
    api.put<{ video: Video }>(`/videos/${id}`, data),
  
  deleteVideo: (id: number) => 
    api.delete(`/videos/${id}`),
  
  getMyVideos: () => 
    api.get<{ videos: Video[] }>('/videos/my-videos'),
};
