import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
});

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

export const eventApi = {
  getEvents: (startDate?: string, endDate?: string) => 
    api.get<Event[]>('/events', { params: { startDate, endDate } }),
  
  createEvent: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Event>('/events', data),
  
  updateEvent: (id: number, data: Partial<Event>) => 
    api.put<Event>(`/events/${id}`, data),
  
  deleteEvent: (id: number) => 
    api.delete(`/events/${id}`),
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
